-- ============================================
-- STEP 1: RUN THIS FIRST - Core Tables
-- ============================================

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) VALUES ('event-assets', 'event-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "storage_auth_insert" ON storage.objects;
  DROP POLICY IF EXISTS "storage_auth_update" ON storage.objects;
  DROP POLICY IF EXISTS "storage_auth_delete" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "storage_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "storage_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "storage_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (true);

-- ============================================
-- VENUES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.venues (
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

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venues_all" ON public.venues;
CREATE POLICY "venues_all" ON public.venues FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- EVENT TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_all" ON public.event_team_members;
CREATE POLICY "team_all" ON public.event_team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- EVENT SUPPLIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_suppliers (
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

ALTER TABLE public.event_suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_all" ON public.event_suppliers;
CREATE POLICY "suppliers_all" ON public.event_suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- EVENT COSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_costs (
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

ALTER TABLE public.event_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "costs_all" ON public.event_costs;
CREATE POLICY "costs_all" ON public.event_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- EXHIBITORS TABLE (Create this FIRST!)
-- ============================================
CREATE TABLE IF NOT EXISTS public.exhibitors (
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
  social_facebook TEXT,
  social_twitter TEXT,
  social_linkedin TEXT,
  social_instagram TEXT,
  products_services TEXT,
  brochure_url TEXT
);

ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exhibitors_all" ON public.exhibitors;
CREATE POLICY "exhibitors_all" ON public.exhibitors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- EXHIBITOR CONTACTS TABLE (After exhibitors!)
-- ============================================
CREATE TABLE IF NOT EXISTS public.exhibitor_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  exhibitor_id UUID REFERENCES public.exhibitors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  profile_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT,
  is_primary BOOLEAN DEFAULT false,
  invitation_status TEXT DEFAULT 'pending',
  invitation_token TEXT,
  invitation_sent_at TIMESTAMPTZ,
  UNIQUE(exhibitor_id, email)
);

ALTER TABLE public.exhibitor_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exhibitor_contacts_all" ON public.exhibitor_contacts;
CREATE POLICY "exhibitor_contacts_all" ON public.exhibitor_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- UPDATE EVENTS TABLE
-- ============================================
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'conference',
ADD COLUMN IF NOT EXISTS branding_logo TEXT,
ADD COLUMN IF NOT EXISTS branding_banner TEXT,
ADD COLUMN IF NOT EXISTS budget_total DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS budget_spent DECIMAL(12, 2) DEFAULT 0;

-- ============================================
-- SAMPLE VENUES
-- ============================================
INSERT INTO public.venues (name, description, address, city, country, capacity, venue_type, amenities, price_range, rating, is_featured, contact_email, contact_phone, website) VALUES
('Dubai World Trade Centre', 'Premier exhibition venue in Dubai', 'Sheikh Zayed Road', 'Dubai', 'UAE', 10000, 'exhibition_center', ARRAY['wifi', 'parking', 'catering', 'av_equipment'], '$$$', 4.8, true, 'info@dwtc.com', '+971 4 332 1000', 'https://www.dwtc.com'),
('Madinat Jumeirah', 'Luxury conference facilities', 'King Salman St', 'Dubai', 'UAE', 3000, 'conference_center', ARRAY['wifi', 'parking', 'catering', 'accommodation'], '$$$$', 4.9, true, 'events@jumeirah.com', '+971 4 366 8888', 'https://www.jumeirah.com'),
('ADNEC', 'Abu Dhabi National Exhibition Centre', 'Khaleej Al Arabi Street', 'Abu Dhabi', 'UAE', 25000, 'exhibition_center', ARRAY['wifi', 'parking', 'catering'], '$$$', 4.7, false, 'info@adnec.ae', '+971 2 444 6900', 'https://www.adnec.ae'),
('Atlantis The Palm', 'Iconic ocean venue', 'The Palm', 'Dubai', 'UAE', 2500, 'hotel_venue', ARRAY['wifi', 'parking', 'catering', 'beach_access'], '$$$$', 4.8, false, 'meetings@atlantis.com', '+971 4 426 2000', 'https://www.atlantis.com'),
('The Agenda', 'Creative event space', 'Media City', 'Dubai', 'UAE', 800, 'creative_space', ARRAY['wifi', 'parking', 'outdoor_space'], '$$', 4.6, false, 'hello@theagenda.ae', '+971 4 123 4567', 'https://www.theagenda.ae'),
('Expo City Dubai', 'Futuristic venue from Expo 2020', 'Expo Road', 'Dubai', 'UAE', 50000, 'exhibition_center', ARRAY['wifi', 'parking', 'metro_access'], '$$$', 4.9, true, 'events@expocitydubai.com', '+971 800 3972', 'https://www.expocitydubai.com')
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exhibitors_event ON public.exhibitors(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitors_status ON public.exhibitors(status);
CREATE INDEX IF NOT EXISTS idx_exhibitor_contacts_exhibitor ON public.exhibitor_contacts(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_contacts_email ON public.exhibitor_contacts(email);
