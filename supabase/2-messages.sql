-- ============================================
-- STEP 2: RUN THIS SECOND - Messages System
-- ============================================

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  subject TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_group BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversations_all" ON public.conversations;
CREATE POLICY "conversations_all" ON public.conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- CONVERSATION PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_read_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT false,
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "participants_all" ON public.conversation_participants;
CREATE POLICY "participants_all" ON public.conversation_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  message_type TEXT DEFAULT 'text', -- text, image, file, system
  attachment_url TEXT,
  parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_all" ON public.messages;
CREATE POLICY "messages_all" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- message, reply, event, system
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}'
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- FUNCTION TO CREATE NOTIFICATION ON NEW MESSAGE
-- ============================================
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  participant RECORD;
  sender_name TEXT;
  conv_subject TEXT;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Get conversation subject
  SELECT subject INTO conv_subject FROM public.conversations WHERE id = NEW.conversation_id;
  
  -- Notify all participants except sender
  FOR participant IN 
    SELECT user_id FROM public.conversation_participants 
    WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      participant.user_id,
      'message',
      'New message from ' || COALESCE(sender_name, 'Unknown'),
      LEFT(NEW.content, 100),
      '/dashboard/messages?conversation=' || NEW.conversation_id,
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id, 'sender_id', NEW.sender_id)
    );
  END LOOP;
  
  -- Update conversation last_message_at
  UPDATE public.conversations SET last_message_at = NOW(), updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_message();

-- ============================================
-- DONE! Messages system ready.
-- ============================================
