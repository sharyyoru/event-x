export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          slug: string
          description: string | null
          start_date: string
          end_date: string
          timezone: string
          venue_id: string | null
          organizer_id: string
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          sanity_id: string | null
          cover_image: string | null
          settings: Json
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      
      venues: {
        Row: {
          id: string
          created_at: string
          name: string
          address: string
          city: string
          state: string
          country: string
          postal_code: string
          capacity: number | null
          amenities: string[]
          contact_email: string | null
          contact_phone: string | null
          website: string | null
          images: string[]
          rating: number | null
          price_range: 'budget' | 'moderate' | 'premium' | 'luxury'
        }
        Insert: Omit<Database['public']['Tables']['venues']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['venues']['Insert']>
      }
      
      floorplans: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          event_id: string
          name: string
          cad_file_url: string | null
          width: number
          height: number
          scale_ratio: number
          background_color: string
          grid_enabled: boolean
        }
        Insert: Omit<Database['public']['Tables']['floorplans']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['floorplans']['Insert']>
      }
      
      booths: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          floorplan_id: string
          label: string
          coordinates: Json // { x, y, width, height, rotation }
          status: 'available' | 'reserved' | 'sold' | 'blocked'
          price: number
          size_category: 'small' | 'medium' | 'large' | 'premium'
          exhibitor_id: string | null
          color: string
          amenities: string[]
        }
        Insert: Omit<Database['public']['Tables']['booths']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['booths']['Insert']>
      }
      
      tickets: {
        Row: {
          id: string
          created_at: string
          event_id: string
          name: string
          description: string | null
          price: number
          currency: string
          quantity_total: number
          quantity_sold: number
          sale_start: string
          sale_end: string
          max_per_order: number
          min_per_order: number
          status: 'active' | 'paused' | 'soldout' | 'ended'
          ticket_type: 'general' | 'vip' | 'speaker' | 'exhibitor' | 'early_bird'
        }
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>
      }
      
      registrations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          event_id: string
          user_id: string
          ticket_id: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in'
          payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
          payment_intent_id: string | null
          amount_paid: number
          check_in_time: string | null
          badge_printed: boolean
          qr_code: string
          custom_fields: Json
        }
        Insert: Omit<Database['public']['Tables']['registrations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['registrations']['Insert']>
      }
      
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string
          avatar_url: string | null
          company: string | null
          job_title: string | null
          bio: string | null
          phone: string | null
          role: 'attendee' | 'organizer' | 'exhibitor' | 'speaker' | 'admin'
          interests: string[]
          linkedin_url: string | null
          twitter_url: string | null
          website_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      
      networking_matches: {
        Row: {
          id: string
          created_at: string
          user_a_id: string
          user_b_id: string
          event_id: string
          match_score: number
          status: 'pending' | 'ignored' | 'connected'
          matched_interests: string[]
        }
        Insert: Omit<Database['public']['Tables']['networking_matches']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['networking_matches']['Insert']>
      }
      
      appointments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          event_id: string
          host_id: string
          guest_id: string
          start_time: string
          end_time: string
          status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'
          location: string | null
          notes: string | null
          meeting_type: 'in_person' | 'virtual'
          virtual_link: string | null
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      
      messages: {
        Row: {
          id: string
          created_at: string
          conversation_id: string
          sender_id: string
          content: string
          read_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          event_id: string
          participant_ids: string[]
          last_message_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      
      sessions: {
        Row: {
          id: string
          created_at: string
          event_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          location: string | null
          track: string | null
          speaker_ids: string[]
          capacity: number | null
          sanity_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>
      }
      
      session_registrations: {
        Row: {
          id: string
          created_at: string
          session_id: string
          user_id: string
          status: 'registered' | 'attended' | 'cancelled'
        }
        Insert: Omit<Database['public']['Tables']['session_registrations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['session_registrations']['Insert']>
      }
      
      polls: {
        Row: {
          id: string
          created_at: string
          session_id: string
          question: string
          options: Json
          status: 'draft' | 'active' | 'closed'
          allow_multiple: boolean
        }
        Insert: Omit<Database['public']['Tables']['polls']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['polls']['Insert']>
      }
      
      poll_responses: {
        Row: {
          id: string
          created_at: string
          poll_id: string
          user_id: string
          selected_options: number[]
        }
        Insert: Omit<Database['public']['Tables']['poll_responses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['poll_responses']['Insert']>
      }
      
      rfp_requests: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          organizer_id: string
          event_name: string
          event_type: string
          start_date: string
          end_date: string
          attendee_count: number
          budget_range: string
          requirements: Json
          status: 'draft' | 'sent' | 'received_bids' | 'closed'
        }
        Insert: Omit<Database['public']['Tables']['rfp_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rfp_requests']['Insert']>
      }
      
      rfp_bids: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          rfp_id: string
          venue_id: string
          proposed_price: number
          proposed_dates: Json
          inclusions: string[]
          notes: string | null
          status: 'pending' | 'accepted' | 'rejected'
        }
        Insert: Omit<Database['public']['Tables']['rfp_bids']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rfp_bids']['Insert']>
      }
      
      lead_captures: {
        Row: {
          id: string
          created_at: string
          event_id: string
          exhibitor_id: string
          attendee_id: string
          booth_id: string | null
          notes: string | null
          tags: string[]
          rating: number | null
          follow_up_status: 'pending' | 'contacted' | 'qualified' | 'converted'
        }
        Insert: Omit<Database['public']['Tables']['lead_captures']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['lead_captures']['Insert']>
      }
      
      saved_connections: {
        Row: {
          id: string
          created_at: string
          user_id: string
          saved_user_id: string
          event_id: string
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['saved_connections']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['saved_connections']['Insert']>
      }
      
      surveys: {
        Row: {
          id: string
          created_at: string
          event_id: string
          title: string
          description: string | null
          questions: Json
          status: 'draft' | 'active' | 'closed'
        }
        Insert: Omit<Database['public']['Tables']['surveys']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['surveys']['Insert']>
      }
      
      survey_responses: {
        Row: {
          id: string
          created_at: string
          survey_id: string
          user_id: string
          answers: Json
          nps_score: number | null
        }
        Insert: Omit<Database['public']['Tables']['survey_responses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['survey_responses']['Insert']>
      }
      
      gamification_points: {
        Row: {
          id: string
          created_at: string
          event_id: string
          user_id: string
          points: number
          action: string
          reference_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['gamification_points']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['gamification_points']['Insert']>
      }
      
      discount_codes: {
        Row: {
          id: string
          created_at: string
          event_id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          max_uses: number | null
          uses_count: number
          valid_from: string
          valid_until: string
          applicable_tickets: string[] | null
        }
        Insert: Omit<Database['public']['Tables']['discount_codes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['discount_codes']['Insert']>
      }
    }
    
    Views: {
      [_ in never]: never
    }
    
    Functions: {
      calculate_match_score: {
        Args: { user_a: string; user_b: string }
        Returns: number
      }
      get_leaderboard: {
        Args: { event_id: string; limit_count: number }
        Returns: Array<{ user_id: string; total_points: number; rank: number }>
      }
    }
    
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Event = Database['public']['Tables']['events']['Row']
export type Venue = Database['public']['Tables']['venues']['Row']
export type Floorplan = Database['public']['Tables']['floorplans']['Row']
export type Booth = Database['public']['Tables']['booths']['Row']
export type Ticket = Database['public']['Tables']['tickets']['Row']
export type Registration = Database['public']['Tables']['registrations']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type NetworkingMatch = Database['public']['Tables']['networking_matches']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type RfpRequest = Database['public']['Tables']['rfp_requests']['Row']
export type RfpBid = Database['public']['Tables']['rfp_bids']['Row']
export type LeadCapture = Database['public']['Tables']['lead_captures']['Row']
export type Survey = Database['public']['Tables']['surveys']['Row']
