-- ============================================
-- COMPLETE EXHIBITOR SYSTEM SQL
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: STORAGE BUCKETS (Profile & Event Assets)
-- ============================================

-- Profile photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Event assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('event-assets', 'event-assets', true, 10485760)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END $$;

-- Create permissive storage policies
CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "storage_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "storage_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "storage_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (true);

-- ============================================
-- PART 2: DROP EXISTING POLICIES (Clean Slate)
-- ============================================

DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- PART 3: VENUES TABLE
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
-- PART 4: EVENT TEAM MEMBERS TABLE
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
-- PART 5: EVENT SUPPLIERS TABLE
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
  category TEXT NOT NULL,
  items_supplied TEXT NOT NULL,
  contract_amount DECIMAL(12, 2),
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT
);

-- ============================================
-- PART 6: EVENT COSTS TABLE
-- ============================================

DROP TABLE IF EXISTS public.event_costs CASCADE;
CREATE TABLE public.event_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_amount DECIMAL(12, 2) NOT NULL,
  actual_amount DECIMAL(12, 2),
  status TEXT DEFAULT 'estimated',
  notes TEXT
);

-- ============================================
-- PART 7: EXHIBITORS TABLE (Main Company Info)
-- ============================================

DROP TABLE IF EXISTS public.exhibitor_team_members CASCADE;
DROP TABLE IF EXISTS public.exhibitor_contacts CASCADE;
DROP TABLE IF EXISTS public.exhibitors CASCADE;

CREATE TABLE public.exhibitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  company_description TEXT,
  company_logo TEXT,
  company_website TEXT,
  industry TEXT,
  booth_size TEXT,
  booth_number TEXT,
  status TEXT DEFAULT 'potential',
  contract_value DECIMAL(12, 2),
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  package_type TEXT,
  package_details TEXT,
  special_requirements TEXT,
  notes TEXT,
  -- Public profile fields (visible to exhibitor)
  social_facebook TEXT,
  social_twitter TEXT,
  social_linkedin TEXT,
  social_instagram TEXT,
  products_services TEXT,
  brochure_url TEXT
);

-- ============================================
-- PART 8: EXHIBITOR CONTACTS (Users linked to exhibitors)
-- ============================================

CREATE TABLE public.exhibitor_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  exhibitor_id UUID REFERENCES public.exhibitors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT,
  is_primary BOOLEAN DEFAULT false,
  invitation_status TEXT DEFAULT 'pending', -- pending, sent, accepted, expired
  invitation_token TEXT,
  invitation_sent_at TIMESTAMPTZ,
  invitation_expires_at TIMESTAMPTZ,
  UNIQUE(exhibitor_id, email)
);

-- ============================================
-- PART 9: EXHIBITOR TEAM MEMBERS (Invited by primary contact)
-- ============================================

CREATE TABLE public.exhibitor_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  exhibitor_id UUID REFERENCES public.exhibitors(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.exhibitor_contacts(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member', -- admin, member
  permissions JSONB DEFAULT '{"view_profile": true, "edit_profile": false, "invite_members": false}'
);

-- ============================================
-- PART 10: UPDATE EVENTS TABLE
-- ============================================

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'conference',
ADD COLUMN IF NOT EXISTS branding_logo TEXT,
ADD COLUMN IF NOT EXISTS branding_banner TEXT,
ADD COLUMN IF NOT EXISTS branding_colors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS budget_total DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS budget_spent DECIMAL(12, 2) DEFAULT 0;

-- ============================================
-- PART 11: ENABLE RLS AND CREATE POLICIES
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_all" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_all" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "events_public" ON public.events FOR SELECT TO anon USING (status = 'published');

-- Venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venues_all" ON public.venues FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "venues_public" ON public.venues FOR SELECT TO anon USING (true);

-- Event Team Members
ALTER TABLE public.event_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_all" ON public.event_team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Event Suppliers
ALTER TABLE public.event_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_all" ON public.event_suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Event Costs
ALTER TABLE public.event_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "costs_all" ON public.event_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Exhibitors
ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exhibitors_all" ON public.exhibitors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Exhibitor Contacts
ALTER TABLE public.exhibitor_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exhibitor_contacts_all" ON public.exhibitor_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Exhibitor Team Members
ALTER TABLE public.exhibitor_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exhibitor_team_all" ON public.exhibitor_team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- PART 12: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_venues_city ON public.venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_country ON public.venues(country);
CREATE INDEX IF NOT EXISTS idx_venues_type ON public.venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_featured ON public.venues(is_featured);
CREATE INDEX IF NOT EXISTS idx_exhibitors_event ON public.exhibitors(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitors_status ON public.exhibitors(status);
CREATE INDEX IF NOT EXISTS idx_exhibitor_contacts_exhibitor ON public.exhibitor_contacts(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_contacts_user ON public.exhibitor_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_contacts_email ON public.exhibitor_contacts(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_event ON public.event_suppliers(event_id);
CREATE INDEX IF NOT EXISTS idx_costs_event ON public.event_costs(event_id);
CREATE INDEX IF NOT EXISTS idx_team_event ON public.event_team_members(event_id);

-- ============================================
-- PART 13: FUNCTION TO CREATE EXHIBITOR USER
-- ============================================

CREATE OR REPLACE FUNCTION create_exhibitor_user(
  p_email TEXT,
  p_full_name TEXT,
  p_exhibitor_id UUID,
  p_temp_password TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_password TEXT;
BEGIN
  -- Generate temp password if not provided
  v_password := COALESCE(p_temp_password, 'Exhibitor' || floor(random() * 9000 + 1000)::text || '!');
  
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'role', 'exhibitor'),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;
  
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, p_email, p_full_name, 'exhibitor');
  
  -- Update exhibitor contact
  UPDATE public.exhibitor_contacts
  SET user_id = v_user_id, 
      profile_id = v_user_id,
      invitation_status = 'accepted'
  WHERE exhibitor_id = p_exhibitor_id AND email = p_email;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 14: SAMPLE VENUES
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

-- ============================================
-- PART 15: API FUNCTION FOR INVITING EXHIBITOR
-- ============================================

CREATE OR REPLACE FUNCTION invite_exhibitor_contact(
  p_exhibitor_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_job_title TEXT DEFAULT NULL,
  p_is_primary BOOLEAN DEFAULT false
)
RETURNS TABLE(contact_id UUID, invitation_token TEXT) AS $$
DECLARE
  v_contact_id UUID;
  v_token TEXT;
BEGIN
  -- Generate invitation token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert contact
  INSERT INTO public.exhibitor_contacts (
    exhibitor_id, full_name, email, phone, job_title, is_primary,
    invitation_token, invitation_sent_at, invitation_expires_at
  ) VALUES (
    p_exhibitor_id, p_full_name, p_email, p_phone, p_job_title, p_is_primary,
    v_token, NOW(), NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_contact_id;
  
  RETURN QUERY SELECT v_contact_id, v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE! All tables and policies created.
-- ============================================
