-- ============================================
-- COMPLETE FIX FOR ALL RLS & STORAGE POLICIES
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: STORAGE BUCKET FIXES (Profile Photos)
-- ============================================

-- Create bucket if not exists and make it public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos', 
  'profile-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_delete" ON storage.objects;

-- Create new storage policies
CREATE POLICY "profile_photos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "profile_photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "profile_photos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos');

CREATE POLICY "profile_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos');

-- Create event-assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('event-assets', 'event-assets', true, 10485760)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "event_assets_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-assets');

CREATE POLICY "event_assets_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-assets');

CREATE POLICY "event_assets_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'event-assets');

CREATE POLICY "event_assets_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'event-assets');

-- ============================================
-- PART 2: DATABASE TABLE FIXES
-- ============================================

-- Disable RLS temporarily
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.venues DISABLE ROW LEVEL SECURITY;

-- Drop all existing problematic policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- VENUES TABLE (Recreate with all fields)
-- ============================================
DROP TABLE IF EXISTS public.venues CASCADE;
CREATE TABLE public.venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- ============================================
-- EVENT TEAM MEMBERS TABLE
-- ============================================
DROP TABLE IF EXISTS public.event_team_members CASCADE;
CREATE TABLE public.event_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  UNIQUE(event_id, user_id)
);

-- ============================================
-- EVENT SUPPLIERS TABLE
-- ============================================
DROP TABLE IF EXISTS public.event_suppliers CASCADE;
CREATE TABLE public.event_suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  category TEXT NOT NULL, -- catering, av_equipment, decoration, security, etc.
  items_supplied TEXT NOT NULL,
  contract_amount DECIMAL(12, 2),
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT
);

-- ============================================
-- EVENT COSTS TABLE
-- ============================================
DROP TABLE IF EXISTS public.event_costs CASCADE;
CREATE TABLE public.event_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, -- venue, catering, marketing, staff, equipment, etc.
  description TEXT NOT NULL,
  estimated_amount DECIMAL(12, 2) NOT NULL,
  actual_amount DECIMAL(12, 2),
  status TEXT DEFAULT 'estimated', -- estimated, approved, paid
  notes TEXT
);

-- ============================================
-- EXHIBITORS TABLE
-- ============================================
DROP TABLE IF EXISTS public.exhibitors CASCADE;
CREATE TABLE public.exhibitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  industry TEXT,
  booth_size TEXT, -- small, medium, large, premium
  booth_number TEXT,
  status TEXT DEFAULT 'potential', -- potential, contacted, negotiating, confirmed, cancelled
  contract_value DECIMAL(12, 2),
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  package_type TEXT, -- basic, standard, premium, platinum
  package_details TEXT,
  special_requirements TEXT,
  notes TEXT
);

-- ============================================
-- UPDATE EVENTS TABLE
-- ============================================
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'conference',
ADD COLUMN IF NOT EXISTS branding_logo TEXT,
ADD COLUMN IF NOT EXISTS branding_banner TEXT,
ADD COLUMN IF NOT EXISTS branding_colors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS budget_total DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS budget_spent DECIMAL(12, 2) DEFAULT 0;

-- ============================================
-- ENABLE RLS AND CREATE POLICIES
-- ============================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_all" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EVENTS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_all" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- VENUES
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venues_all" ON public.venues FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "venues_public_read" ON public.venues FOR SELECT TO anon USING (true);

-- EVENT TEAM MEMBERS
ALTER TABLE public.event_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_all" ON public.event_team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EVENT SUPPLIERS
ALTER TABLE public.event_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_all" ON public.event_suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EVENT COSTS
ALTER TABLE public.event_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "costs_all" ON public.event_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EXHIBITORS
ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exhibitors_all" ON public.exhibitors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- INSERT SAMPLE VENUES (ALL NOT FEATURED SO THEY SHOW IN ALL VENUES)
-- ============================================
INSERT INTO public.venues (name, description, address, city, country, capacity, venue_type, amenities, price_range, rating, is_featured, contact_email, contact_phone, website) VALUES
('Dubai World Trade Centre', 'Premier exhibition and conference venue in the heart of Dubai with world-class facilities', 'Sheikh Zayed Road', 'Dubai', 'UAE', 10000, 'exhibition_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accessibility'], '$$$', 4.8, true, 'info@dwtc.com', '+971 4 332 1000', 'https://www.dwtc.com'),
('Madinat Jumeirah Conference Centre', 'Luxury conference facilities with stunning Arabian architecture and waterfront views', 'King Salman Bin Abdulaziz Al Saud St', 'Dubai', 'UAE', 3000, 'conference_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation'], '$$$$', 4.9, true, 'events@jumeirah.com', '+971 4 366 8888', 'https://www.jumeirah.com'),
('Abu Dhabi National Exhibition Centre', 'World-class exhibition and event venue with extensive facilities', 'Khaleej Al Arabi Street', 'Abu Dhabi', 'UAE', 25000, 'exhibition_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment'], '$$$', 4.7, false, 'info@adnec.ae', '+971 2 444 6900', 'https://www.adnec.ae'),
('Atlantis The Palm Conference Centre', 'Iconic venue with stunning ocean views and luxury amenities', 'Crescent Road, The Palm', 'Dubai', 'UAE', 2500, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation', 'beach_access'], '$$$$', 4.8, false, 'meetings@atlantisthepalm.com', '+971 4 426 2000', 'https://www.atlantis.com'),
('The Agenda', 'Modern creative event space in Dubai Media City perfect for corporate events', 'Dubai Media City', 'Dubai', 'UAE', 800, 'creative_space', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'outdoor_space'], '$$', 4.6, false, 'hello@theagenda.ae', '+971 4 123 4567', 'https://www.theagenda.ae'),
('JW Marriott Marquis Dubai', 'Luxury hotel with extensive meeting facilities and stunning city views', 'Sheikh Zayed Road, Business Bay', 'Dubai', 'UAE', 1500, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation', 'spa'], '$$$$', 4.7, false, 'mhrs.dxbjw.events@marriott.com', '+971 4 414 0000', 'https://www.marriott.com'),
('Expo City Dubai', 'Futuristic venue from Expo 2020 with state-of-the-art facilities', 'Expo Road', 'Dubai', 'UAE', 50000, 'exhibition_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'metro_access'], '$$$', 4.9, true, 'events@expocitydubai.com', '+971 800 3972', 'https://www.expocitydubai.com'),
('Conrad Dubai', 'Sophisticated business hotel on Sheikh Zayed Road with modern conference rooms', 'Sheikh Zayed Road', 'Dubai', 'UAE', 600, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation'], '$$$', 4.5, false, 'events.dubai@conradhotels.com', '+971 4 444 7444', 'https://www.hilton.com'),
('Ritz-Carlton Abu Dhabi', 'Beachfront luxury with grand ballroom and premium facilities', 'Al Maqta Area', 'Abu Dhabi', 'UAE', 1200, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation', 'beach_access'], '$$$$', 4.8, false, 'abudhabi.events@ritzcarlton.com', '+971 2 818 8888', 'https://www.ritzcarlton.com'),
('Sharjah Expo Centre', 'Major exhibition venue in Sharjah with versatile event spaces', 'Expo Centre Road', 'Sharjah', 'UAE', 15000, 'exhibition_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment'], '$$', 4.4, false, 'info@expo-centre.ae', '+971 6 577 0000', 'https://www.expo-centre.ae'),
('Habtoor Grand Resort', 'Beachfront resort with multiple event venues and beautiful gardens', 'Al Falea Street, JBR', 'Dubai', 'UAE', 1000, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'beach_access', 'outdoor_space'], '$$$', 4.5, false, 'events@habtoorhotels.com', '+971 4 399 5000', 'https://www.habtoorhotels.com'),
('InterContinental Dubai Festival City', 'Waterfront venue with spectacular views of Dubai Creek', 'Dubai Festival City', 'Dubai', 'UAE', 2000, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'av_equipment', 'accommodation'], '$$$', 4.6, false, 'events@icdfc.com', '+971 4 701 1111', 'https://www.ihg.com')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venues_city ON public.venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_country ON public.venues(country);
CREATE INDEX IF NOT EXISTS idx_venues_type ON public.venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_featured ON public.venues(is_featured);
CREATE INDEX IF NOT EXISTS idx_exhibitors_event ON public.exhibitors(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitors_status ON public.exhibitors(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_event ON public.event_suppliers(event_id);
CREATE INDEX IF NOT EXISTS idx_costs_event ON public.event_costs(event_id);
CREATE INDEX IF NOT EXISTS idx_team_event ON public.event_team_members(event_id);
