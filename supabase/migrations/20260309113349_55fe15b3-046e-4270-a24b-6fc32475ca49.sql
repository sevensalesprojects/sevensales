
-- Instagram accounts connected to projects
CREATE TABLE public.instagram_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  instagram_user_id text NOT NULL,
  page_id text,
  username text,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint per project + instagram account
ALTER TABLE public.instagram_accounts ADD CONSTRAINT unique_project_instagram UNIQUE (project_id, instagram_user_id);

-- Enable RLS
ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;

-- Only admin_master can manage instagram accounts
CREATE POLICY "Admin master can manage instagram accounts"
  ON public.instagram_accounts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin_master'::app_role));

-- Admins can view
CREATE POLICY "Admins can view instagram accounts"
  ON public.instagram_accounts FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- Users with project access can view
CREATE POLICY "Project users can view instagram accounts"
  ON public.instagram_accounts FOR SELECT TO authenticated
  USING (has_project_access(auth.uid(), project_id));

-- Add instagram_message_id to messages for dedup
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS instagram_message_id text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
