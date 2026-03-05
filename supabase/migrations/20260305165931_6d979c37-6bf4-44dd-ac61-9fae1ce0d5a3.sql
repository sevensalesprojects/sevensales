
-- =============================================
-- 1. ROLES ENUM & USER ROLES TABLE
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin_master', 'admin', 'gestor', 'sdr', 'closer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin_master', 'admin')
  )
$$;

-- RLS: only admins can manage roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin master can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'));

-- =============================================
-- 2. PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 3. PROJECTS TABLE
-- =============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  language TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. USER <-> PROJECT RELATIONSHIP
-- =============================================
CREATE TABLE public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (user_id, project_id)
);
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- Helper: check if user has access to project
CREATE OR REPLACE FUNCTION public.has_project_access(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin_master')
    OR EXISTS (
      SELECT 1 FROM public.user_projects
      WHERE user_id = _user_id AND project_id = _project_id
    )
$$;

-- RLS for projects
CREATE POLICY "Admin master sees all projects"
  ON public.projects FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_master')
    OR id IN (SELECT project_id FROM public.user_projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Admin master can manage projects"
  ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'));

-- RLS for user_projects
CREATE POLICY "Admins can view user_projects"
  ON public.user_projects FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Admin master can manage user_projects"
  ON public.user_projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'));

-- =============================================
-- 5. TAGS
-- =============================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('origin', 'temperature', 'status', 'general')),
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tags_project ON public.tags(project_id);

CREATE POLICY "Users with project access can view tags"
  ON public.tags FOR SELECT TO authenticated
  USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY "Admins can manage tags"
  ON public.tags FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- =============================================
-- 6. FUNNELS & STAGES
-- =============================================
CREATE TABLE public.funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'sdr' CHECK (type IN ('sdr', 'closer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_funnels_project ON public.funnels(project_id);

CREATE POLICY "Users with project access can view funnels"
  ON public.funnels FOR SELECT TO authenticated
  USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY "Admins can manage funnels"
  ON public.funnels FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TABLE public.funnel_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6366f1'
);
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_stages_funnel ON public.funnel_stages(funnel_id);

CREATE POLICY "Users can view stages of accessible funnels"
  ON public.funnel_stages FOR SELECT TO authenticated
  USING (
    funnel_id IN (
      SELECT id FROM public.funnels WHERE public.has_project_access(auth.uid(), project_id)
    )
  );
CREATE POLICY "Admins can manage stages"
  ON public.funnel_stages FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- =============================================
-- 7. LEADS
-- =============================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  source TEXT,
  channel TEXT CHECK (channel IN ('instagram', 'whatsapp', 'youtube', 'trafego_pago', 'indicacao', 'outro')),
  sdr_id UUID REFERENCES auth.users(id),
  closer_id UUID REFERENCES auth.users(id),
  stage_id UUID REFERENCES public.funnel_stages(id),
  funnel_id UUID REFERENCES public.funnels(id),
  value_estimate NUMERIC(12,2),
  response_time_minutes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_leads_project ON public.leads(project_id);
CREATE INDEX idx_leads_sdr ON public.leads(sdr_id);
CREATE INDEX idx_leads_closer ON public.leads(closer_id);
CREATE INDEX idx_leads_stage ON public.leads(stage_id);
CREATE INDEX idx_leads_created ON public.leads(created_at);

CREATE POLICY "Users with project access can view leads"
  ON public.leads FOR SELECT TO authenticated
  USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY "SDRs can view own leads"
  ON public.leads FOR SELECT TO authenticated
  USING (sdr_id = auth.uid() OR closer_id = auth.uid());
CREATE POLICY "Admins can manage all leads"
  ON public.leads FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "SDRs can update own leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (sdr_id = auth.uid());

-- =============================================
-- 8. LEAD TAGS (junction)
-- =============================================
CREATE TABLE public.lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (lead_id, tag_id)
);
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead tags"
  ON public.lead_tags FOR SELECT TO authenticated
  USING (
    lead_id IN (SELECT id FROM public.leads WHERE public.has_project_access(auth.uid(), project_id))
  );
CREATE POLICY "Admins can manage lead tags"
  ON public.lead_tags FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- =============================================
-- 9. MESSAGES (omnichannel)
-- =============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'internal')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  media_url TEXT,
  sender_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_lead ON public.messages(lead_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);

CREATE POLICY "Users can view messages of accessible leads"
  ON public.messages FOR SELECT TO authenticated
  USING (
    lead_id IN (SELECT id FROM public.leads WHERE public.has_project_access(auth.uid(), project_id) OR sdr_id = auth.uid() OR closer_id = auth.uid())
  );
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Admins can manage messages"
  ON public.messages FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- =============================================
-- 10. TASKS
-- =============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'follow_up' CHECK (type IN ('follow_up', 'call', 'meeting', 'other')),
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tasks_user ON public.tasks(user_id);
CREATE INDEX idx_tasks_lead ON public.tasks(lead_id);

CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Users can manage own tasks"
  ON public.tasks FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- =============================================
-- 11. CALLS (appointments)
-- =============================================
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  sdr_id UUID REFERENCES auth.users(id),
  closer_id UUID REFERENCES auth.users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'no_show', 'cancelled', 'rescheduled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_calls_lead ON public.calls(lead_id);
CREATE INDEX idx_calls_sdr ON public.calls(sdr_id);
CREATE INDEX idx_calls_closer ON public.calls(closer_id);
CREATE INDEX idx_calls_scheduled ON public.calls(scheduled_at);

CREATE POLICY "Users can view relevant calls"
  ON public.calls FOR SELECT TO authenticated
  USING (sdr_id = auth.uid() OR closer_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage calls"
  ON public.calls FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "SDRs can create calls"
  ON public.calls FOR INSERT TO authenticated
  WITH CHECK (sdr_id = auth.uid());

-- =============================================
-- 12. SALES
-- =============================================
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  product TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'hotmart', 'other')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'cancelled', 'refunded')),
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sales_project ON public.sales(project_id);
CREATE INDEX idx_sales_lead ON public.sales(lead_id);

CREATE POLICY "Users with project access can view sales"
  ON public.sales FOR SELECT TO authenticated
  USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY "Admins can manage sales"
  ON public.sales FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- =============================================
-- 13. INTEGRATIONS
-- =============================================
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'instagram', 'hotmart')),
  config_json JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_integrations_project ON public.integrations(project_id);

CREATE POLICY "Admins can view integrations"
  ON public.integrations FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin master can manage integrations"
  ON public.integrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'));

-- =============================================
-- 14. WEBHOOK EVENTS
-- =============================================
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_webhook_events_integration ON public.webhook_events(integration_id);

CREATE POLICY "Admins can view webhook events"
  ON public.webhook_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- =============================================
-- 15. LEAD NOTES
-- =============================================
CREATE TABLE public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_lead_notes_lead ON public.lead_notes(lead_id);

CREATE POLICY "Users can view notes of accessible leads"
  ON public.lead_notes FOR SELECT TO authenticated
  USING (
    lead_id IN (SELECT id FROM public.leads WHERE public.has_project_access(auth.uid(), project_id) OR sdr_id = auth.uid() OR closer_id = auth.uid())
  );
CREATE POLICY "Users can create notes"
  ON public.lead_notes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- 16. AUTOMATIONS
-- =============================================
CREATE TABLE public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('lead_created', 'stage_changed', 'webhook_received', 'inactivity', 'appointment_scheduled')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL CHECK (action_type IN ('send_message', 'move_stage', 'create_task', 'assign_user', 'add_tag', 'notify')),
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_automations_project ON public.automations(project_id);

CREATE POLICY "Admins can view automations"
  ON public.automations FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin master can manage automations"
  ON public.automations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'));

-- =============================================
-- 17. UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
