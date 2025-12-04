-- EventX Database Schema for Supabase
-- This file contains the complete database schema for the event management platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector"; -- For AI-powered matchmaking

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  company TEXT,
  job_title TEXT,
  bio TEXT,
  phone TEXT,
  role TEXT DEFAULT 'attendee' CHECK (role IN ('attendee', 'organizer', 'exhibitor', 'speaker', 'admin')),
  interests TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  -- For AI matchmaking
  embedding VECTOR(1536)
);

-- ============================================
-- VENUES
-- ============================================
CREATE TABLE public.venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  capacity INTEGER,
  amenities TEXT[] DEFAULT '{}',
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  images TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1),
  price_range TEXT CHECK (price_range IN ('budget', 'moderate', 'premium', 'luxury'))
);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  sanity_id TEXT, -- Link to Sanity CMS content
  cover_image TEXT,
  settings JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- FLOOR PLANS
-- ============================================
CREATE TABLE public.floorplans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cad_file_url TEXT,
  width INTEGER DEFAULT 1000,
  height INTEGER DEFAULT 800,
  scale_ratio DECIMAL(10,4) DEFAULT 1.0,
  background_color TEXT DEFAULT '#f8fafc',
  grid_enabled BOOLEAN DEFAULT true
);

-- ============================================
-- BOOTHS
-- ============================================
CREATE TABLE public.booths (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  floorplan_id UUID REFERENCES public.floorplans(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  coordinates JSONB NOT NULL, -- {x, y, width, height, rotation}
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'blocked')),
  price DECIMAL(10,2) DEFAULT 0,
  size_category TEXT DEFAULT 'medium' CHECK (size_category IN ('small', 'medium', 'large', 'premium')),
  exhibitor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#3b82f6',
  amenities TEXT[] DEFAULT '{}'
);

-- ============================================
-- TICKETS
-- ============================================
CREATE TABLE public.tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  quantity_total INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  sale_start TIMESTAMPTZ NOT NULL,
  sale_end TIMESTAMPTZ NOT NULL,
  max_per_order INTEGER DEFAULT 10,
  min_per_order INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'soldout', 'ended')),
  ticket_type TEXT DEFAULT 'general' CHECK (ticket_type IN ('general', 'vip', 'speaker', 'exhibitor', 'early_bird'))
);

-- ============================================
-- REGISTRATIONS
-- ============================================
CREATE TABLE public.registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'checked_in')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_intent_id TEXT,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  check_in_time TIMESTAMPTZ,
  badge_printed BOOLEAN DEFAULT false,
  qr_code TEXT NOT NULL,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  UNIQUE(event_id, user_id)
);

-- ============================================
-- SESSIONS (Event Agenda)
-- ============================================
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  track TEXT,
  speaker_ids UUID[] DEFAULT '{}',
  capacity INTEGER,
  sanity_id TEXT
);

-- ============================================
-- SESSION REGISTRATIONS
-- ============================================
CREATE TABLE public.session_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  UNIQUE(session_id, user_id)
);

-- ============================================
-- NETWORKING MATCHES
-- ============================================
CREATE TABLE public.networking_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_a_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_b_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  match_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ignored', 'connected')),
  matched_interests TEXT[] DEFAULT '{}',
  UNIQUE(user_a_id, user_b_id, event_id)
);

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE TABLE public.appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  location TEXT,
  notes TEXT,
  meeting_type TEXT DEFAULT 'in_person' CHECK (meeting_type IN ('in_person', 'virtual')),
  virtual_link TEXT
);

-- ============================================
-- CONVERSATIONS
-- ============================================
CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  participant_ids UUID[] NOT NULL,
  last_message_at TIMESTAMPTZ
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ
);

-- ============================================
-- RFP REQUESTS
-- ============================================
CREATE TABLE public.rfp_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  attendee_count INTEGER,
  budget_range TEXT,
  requirements JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received_bids', 'closed'))
);

-- ============================================
-- RFP BIDS
-- ============================================
CREATE TABLE public.rfp_bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  rfp_id UUID REFERENCES public.rfp_requests(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  proposed_price DECIMAL(12,2) NOT NULL,
  proposed_dates JSONB,
  inclusions TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- ============================================
-- LEAD CAPTURES
-- ============================================
CREATE TABLE public.lead_captures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  exhibitor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  attendee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booth_id UUID REFERENCES public.booths(id) ON DELETE SET NULL,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  follow_up_status TEXT DEFAULT 'pending' CHECK (follow_up_status IN ('pending', 'contacted', 'qualified', 'converted'))
);

-- ============================================
-- POLLS
-- ============================================
CREATE TABLE public.polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- [{id: 1, text: "Option A", votes: 0}]
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  allow_multiple BOOLEAN DEFAULT false
);

-- ============================================
-- POLL RESPONSES
-- ============================================
CREATE TABLE public.poll_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  selected_options INTEGER[] NOT NULL,
  UNIQUE(poll_id, user_id)
);

-- ============================================
-- SURVEYS
-- ============================================
CREATE TABLE public.surveys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed'))
);

-- ============================================
-- SURVEY RESPONSES
-- ============================================
CREATE TABLE public.survey_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  UNIQUE(survey_id, user_id)
);

-- ============================================
-- SAVED CONNECTIONS
-- ============================================
CREATE TABLE public.saved_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  saved_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  UNIQUE(user_id, saved_user_id, event_id)
);

-- ============================================
-- GAMIFICATION POINTS
-- ============================================
CREATE TABLE public.gamification_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  action TEXT NOT NULL,
  reference_id TEXT
);

-- ============================================
-- DISCOUNT CODES
-- ============================================
CREATE TABLE public.discount_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  applicable_tickets UUID[] DEFAULT NULL,
  UNIQUE(event_id, code)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_dates ON public.events(start_date, end_date);
CREATE INDEX idx_registrations_event ON public.registrations(event_id);
CREATE INDEX idx_registrations_user ON public.registrations(user_id);
CREATE INDEX idx_booths_floorplan ON public.booths(floorplan_id);
CREATE INDEX idx_booths_status ON public.booths(status);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_networking_matches_event ON public.networking_matches(event_id);
CREATE INDEX idx_appointments_event ON public.appointments(event_id);
CREATE INDEX idx_sessions_event ON public.sessions(event_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floorplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networking_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Events: Public events are viewable by everyone
CREATE POLICY "Published events are viewable by everyone" ON public.events
  FOR SELECT USING (status = 'published');

CREATE POLICY "Organizers can manage their events" ON public.events
  FOR ALL USING (auth.uid() = organizer_id);

-- Messages: Only participants can view their messages
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_id
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate match score between two users
CREATE OR REPLACE FUNCTION calculate_match_score(user_a UUID, user_b UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER;
  interests_a TEXT[];
  interests_b TEXT[];
  common_count INTEGER;
BEGIN
  SELECT interests INTO interests_a FROM public.profiles WHERE id = user_a;
  SELECT interests INTO interests_b FROM public.profiles WHERE id = user_b;
  
  SELECT COUNT(*) INTO common_count
  FROM unnest(interests_a) a
  WHERE a = ANY(interests_b);
  
  IF array_length(interests_a, 1) IS NULL OR array_length(interests_b, 1) IS NULL THEN
    RETURN 0;
  END IF;
  
  score := (common_count * 100) / 
    GREATEST(array_length(interests_a, 1), array_length(interests_b, 1));
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to get leaderboard for gamification
CREATE OR REPLACE FUNCTION get_leaderboard(p_event_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (user_id UUID, total_points BIGINT, rank BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.user_id,
    SUM(gp.points)::BIGINT as total_points,
    ROW_NUMBER() OVER (ORDER BY SUM(gp.points) DESC)::BIGINT as rank
  FROM public.gamification_points gp
  WHERE gp.event_id = p_event_id
  GROUP BY gp.user_id
  ORDER BY total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_floorplans_updated_at BEFORE UPDATE ON public.floorplans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booths_updated_at BEFORE UPDATE ON public.booths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
