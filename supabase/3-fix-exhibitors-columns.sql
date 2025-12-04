-- ============================================
-- FIX ALL MISSING EXHIBITOR COLUMNS
-- Run this in Supabase SQL Editor
-- ============================================

-- Add ALL missing columns to exhibitors table
ALTER TABLE public.exhibitors 
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS company_logo TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS booth_size TEXT,
ADD COLUMN IF NOT EXISTS booth_number TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'potential',
ADD COLUMN IF NOT EXISTS contract_value DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS package_type TEXT,
ADD COLUMN IF NOT EXISTS package_details TEXT,
ADD COLUMN IF NOT EXISTS special_requirements TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS social_facebook TEXT,
ADD COLUMN IF NOT EXISTS social_twitter TEXT,
ADD COLUMN IF NOT EXISTS social_linkedin TEXT,
ADD COLUMN IF NOT EXISTS social_instagram TEXT,
ADD COLUMN IF NOT EXISTS products_services TEXT,
ADD COLUMN IF NOT EXISTS brochure_url TEXT;

-- Ensure RLS policy exists
ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exhibitors_all" ON public.exhibitors;
CREATE POLICY "exhibitors_all" ON public.exhibitors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- DONE!
-- ============================================
