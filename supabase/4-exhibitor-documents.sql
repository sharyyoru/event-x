-- ============================================
-- EXHIBITOR DOCUMENTS & REQUIREMENTS SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- Create exhibitor_documents table for document submissions
CREATE TABLE IF NOT EXISTS public.exhibitor_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibitor_id UUID REFERENCES public.exhibitors(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'company_profile', 'trade_license', 'insurance', 'visa', 'passport', 'id_card', 'other'
    document_name TEXT NOT NULL,
    file_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'resubmit'
    rejection_reason TEXT,
    submitted_by UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    team_member_id UUID, -- For visa/passport docs linked to specific team member
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exhibitor_team table for team members
CREATE TABLE IF NOT EXISTS public.exhibitor_team (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibitor_id UUID REFERENCES public.exhibitors(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    designation TEXT NOT NULL, -- 'Manager', 'Sales Rep', 'Technical', 'Support', etc.
    role TEXT DEFAULT 'member', -- 'primary', 'admin', 'member'
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'inactive'
    invite_token TEXT,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exhibitor_id, email)
);

-- Create exhibitor_event_details for event-specific info
CREATE TABLE IF NOT EXISTS public.exhibitor_event_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibitor_id UUID REFERENCES public.exhibitors(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    stand_number TEXT,
    stand_size TEXT,
    stand_type TEXT, -- 'shell_scheme', 'raw_space', 'custom'
    package_name TEXT,
    package_details TEXT,
    special_requirements TEXT,
    setup_date DATE,
    setup_time TEXT,
    breakdown_date DATE,
    breakdown_time TEXT,
    electricity_required BOOLEAN DEFAULT false,
    water_required BOOLEAN DEFAULT false,
    internet_required BOOLEAN DEFAULT false,
    additional_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exhibitor_id, event_id)
);

-- Create document_requirements table (what documents are required per event)
CREATE TABLE IF NOT EXISTS public.document_requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT true,
    deadline DATE,
    per_team_member BOOLEAN DEFAULT false, -- If true, each team member needs to submit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exhibitor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitor_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitor_event_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "exhibitor_documents_all" ON public.exhibitor_documents;
CREATE POLICY "exhibitor_documents_all" ON public.exhibitor_documents 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "exhibitor_team_all" ON public.exhibitor_team;
CREATE POLICY "exhibitor_team_all" ON public.exhibitor_team 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "exhibitor_event_details_all" ON public.exhibitor_event_details;
CREATE POLICY "exhibitor_event_details_all" ON public.exhibitor_event_details 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "document_requirements_all" ON public.document_requirements;
CREATE POLICY "document_requirements_all" ON public.document_requirements 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exhibitor_documents_exhibitor ON public.exhibitor_documents(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_documents_status ON public.exhibitor_documents(status);
CREATE INDEX IF NOT EXISTS idx_exhibitor_team_exhibitor ON public.exhibitor_team(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_event_details_exhibitor ON public.exhibitor_event_details(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_event_details_event ON public.exhibitor_event_details(event_id);

-- Create storage bucket for exhibitor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('exhibitor-documents', 'exhibitor-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for exhibitor documents
DROP POLICY IF EXISTS "exhibitor_docs_select" ON storage.objects;
CREATE POLICY "exhibitor_docs_select" ON storage.objects
    FOR SELECT TO authenticated USING (bucket_id = 'exhibitor-documents');

DROP POLICY IF EXISTS "exhibitor_docs_insert" ON storage.objects;
CREATE POLICY "exhibitor_docs_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'exhibitor-documents');

DROP POLICY IF EXISTS "exhibitor_docs_update" ON storage.objects;
CREATE POLICY "exhibitor_docs_update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'exhibitor-documents');

DROP POLICY IF EXISTS "exhibitor_docs_delete" ON storage.objects;
CREATE POLICY "exhibitor_docs_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'exhibitor-documents');

-- Function to notify exhibitor when document is reviewed
CREATE OR REPLACE FUNCTION notify_document_review()
RETURNS TRIGGER AS $$
DECLARE
    exhibitor_user_id UUID;
    doc_status TEXT;
    doc_name TEXT;
BEGIN
    -- Only trigger on status change
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Get document details
    doc_name := NEW.document_name;
    doc_status := NEW.status;

    -- Find the primary contact user_id for this exhibitor
    SELECT ec.user_id INTO exhibitor_user_id
    FROM exhibitor_contacts ec
    WHERE ec.exhibitor_id = NEW.exhibitor_id 
      AND ec.is_primary = true
      AND ec.user_id IS NOT NULL
    LIMIT 1;

    -- If no primary contact, try to get any contact
    IF exhibitor_user_id IS NULL THEN
        SELECT ec.user_id INTO exhibitor_user_id
        FROM exhibitor_contacts ec
        WHERE ec.exhibitor_id = NEW.exhibitor_id 
          AND ec.user_id IS NOT NULL
        LIMIT 1;
    END IF;

    -- Create notification if user found
    IF exhibitor_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            link
        ) VALUES (
            exhibitor_user_id,
            'document_review',
            CASE 
                WHEN doc_status = 'approved' THEN 'Document Approved'
                WHEN doc_status = 'rejected' THEN 'Document Rejected'
                ELSE 'Document Status Updated'
            END,
            CASE 
                WHEN doc_status = 'approved' THEN 'Your document "' || doc_name || '" has been approved.'
                WHEN doc_status = 'rejected' THEN 'Your document "' || doc_name || '" was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'Not specified')
                ELSE 'Your document "' || doc_name || '" status has been updated to ' || doc_status
            END,
            '/dashboard/exhibitor-portal?tab=documents'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document review notifications
DROP TRIGGER IF EXISTS trigger_document_review ON public.exhibitor_documents;
CREATE TRIGGER trigger_document_review
    AFTER UPDATE ON public.exhibitor_documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_document_review();

-- Insert default document requirements for reference
-- (These can be customized per event by admins)

-- ============================================
-- DONE!
-- ============================================
