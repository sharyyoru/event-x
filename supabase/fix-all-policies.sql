-- ============================================
-- COMPREHENSIVE RLS POLICIES FIX
-- Run this in Supabase SQL Editor
-- ============================================

-- Disable RLS temporarily to fix policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Organizers and admins can create events" ON public.events;
DROP POLICY IF EXISTS "Event owners can update their events" ON public.events;
DROP POLICY IF EXISTS "Anyone can create events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;

-- ============================================
-- PROFILES POLICIES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can insert their own profile (for signup trigger)
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Service role can do anything (for admin operations via API)
CREATE POLICY "profiles_service_role_policy" ON public.profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- EVENTS POLICIES
-- ============================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anyone can view events
CREATE POLICY "events_select_policy" ON public.events
  FOR SELECT
  USING (true);

-- Authenticated users can create events
CREATE POLICY "events_insert_policy" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

-- Event organizers can update their own events
CREATE POLICY "events_update_policy" ON public.events
  FOR UPDATE TO authenticated
  USING (auth.uid() = organizer_id);

-- Event organizers can delete their own events
CREATE POLICY "events_delete_policy" ON public.events
  FOR DELETE TO authenticated
  USING (auth.uid() = organizer_id);

-- Service role can do anything
CREATE POLICY "events_service_role_policy" ON public.events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VENUES TABLE (Create if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  capacity INTEGER,
  venue_type TEXT DEFAULT 'conference_center',
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  price_range TEXT,
  rating DECIMAL(2, 1),
  is_featured BOOLEAN DEFAULT false
);

-- Venues policies
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venues_select_policy" ON public.venues
  FOR SELECT USING (true);

CREATE POLICY "venues_insert_policy" ON public.venues
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "venues_update_policy" ON public.venues
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "venues_delete_policy" ON public.venues
  FOR DELETE TO authenticated
  USING (true);

-- ============================================
-- EVENT TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_team_select_policy" ON public.event_team_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "event_team_insert_policy" ON public.event_team_members
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "event_team_delete_policy" ON public.event_team_members
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- INSERT SAMPLE VENUES
-- ============================================
INSERT INTO public.venues (name, description, address, city, country, capacity, venue_type, amenities, price_range, rating, is_featured) VALUES
('Dubai World Trade Centre', 'Premier exhibition and conference venue in the heart of Dubai', 'Sheikh Zayed Road', 'Dubai', 'UAE', 10000, 'exhibition_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accessibility'], '$$$', 4.8, true),
('Madinat Jumeirah Conference Centre', 'Luxury conference facilities with Arabian architecture', 'King Salman Bin Abdulaziz Al Saud St', 'Dubai', 'UAE', 3000, 'conference_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation'], '$$$$', 4.9, true),
('Abu Dhabi National Exhibition Centre', 'World-class exhibition and event venue', 'Khaleej Al Arabi Street', 'Abu Dhabi', 'UAE', 25000, 'exhibition_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment'], '$$$', 4.7, true),
('Atlantis The Palm Conference Centre', 'Iconic venue with stunning ocean views', 'Crescent Road, The Palm', 'Dubai', 'UAE', 2500, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation', 'beach_access'], '$$$$', 4.8, true),
('The Agenda', 'Modern creative event space in Dubai Media City', 'Dubai Media City', 'Dubai', 'UAE', 800, 'creative_space', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'outdoor_space'], '$$', 4.6, false),
('JW Marriott Marquis Dubai', 'Luxury hotel with extensive meeting facilities', 'Sheikh Zayed Road, Business Bay', 'Dubai', 'UAE', 1500, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation', 'spa'], '$$$$', 4.7, true),
('Expo City Dubai', 'Futuristic venue from Expo 2020', 'Expo Road', 'Dubai', 'UAE', 50000, 'exhibition_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'metro_access'], '$$$', 4.9, true),
('Conrad Dubai', 'Sophisticated business hotel on Sheikh Zayed Road', 'Sheikh Zayed Road', 'Dubai', 'UAE', 600, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation'], '$$$', 4.5, false),
('Ritz-Carlton Abu Dhabi', 'Beachfront luxury with grand ballroom', 'Al Maqta Area', 'Abu Dhabi', 'UAE', 1200, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation', 'beach_access'], '$$$$', 4.8, true),
('Sharjah Expo Centre', 'Major exhibition venue in Sharjah', 'Expo Centre Road', 'Sharjah', 'UAE', 15000, 'exhibition_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment'], '$$', 4.4, false)
ON CONFLICT DO NOTHING;

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_venues_city ON public.venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_country ON public.venues(country);
CREATE INDEX IF NOT EXISTS idx_venues_type ON public.venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_featured ON public.venues(is_featured);
