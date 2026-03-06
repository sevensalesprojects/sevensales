
-- Add currency_code to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'BRL';

-- Follow-up flows
CREATE TABLE public.followup_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_condition text NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.followup_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES public.followup_flows(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  delay_hours integer NOT NULL DEFAULT 24,
  order_position integer NOT NULL DEFAULT 0
);

CREATE TABLE public.followup_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  flow_id uuid NOT NULL REFERENCES public.followup_flows(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.followup_messages(id) ON DELETE CASCADE,
  assigned_sdr uuid NOT NULL,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  entity_type text,
  entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- System logs
CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Deleted records (soft delete / rollback)
CREATE TABLE public.deleted_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  data_snapshot jsonb NOT NULL,
  deleted_by uuid,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

-- WhatsApp sessions
CREATE TABLE public.whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  phone_number text,
  session_token text,
  status text NOT NULL DEFAULT 'disconnected',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for all new tables
ALTER TABLE public.followup_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- followup_flows policies
CREATE POLICY "Admins can manage followup flows" ON public.followup_flows FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users with project access can view flows" ON public.followup_flows FOR SELECT USING (has_project_access(auth.uid(), project_id));

-- followup_messages policies
CREATE POLICY "Admins can manage followup messages" ON public.followup_messages FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view followup messages" ON public.followup_messages FOR SELECT USING (
  flow_id IN (SELECT id FROM public.followup_flows WHERE has_project_access(auth.uid(), project_id))
);

-- followup_tasks policies
CREATE POLICY "Admins can manage followup tasks" ON public.followup_tasks FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "SDRs can view own followup tasks" ON public.followup_tasks FOR SELECT USING (assigned_sdr = auth.uid());
CREATE POLICY "SDRs can update own followup tasks" ON public.followup_tasks FOR UPDATE USING (assigned_sdr = auth.uid());

-- notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (is_admin(auth.uid()));

-- system_logs policies
CREATE POLICY "Admins can view system logs" ON public.system_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert system logs" ON public.system_logs FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() = user_id);

-- audit_logs policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (changed_by = auth.uid());

-- deleted_records policies
CREATE POLICY "Admins can manage deleted records" ON public.deleted_records FOR ALL USING (is_admin(auth.uid()));

-- whatsapp_sessions policies
CREATE POLICY "Admins can manage whatsapp sessions" ON public.whatsapp_sessions FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own sessions" ON public.whatsapp_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own sessions" ON public.whatsapp_sessions FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON public.leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_sdr_id ON public.leads(sdr_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_followup_tasks_assigned_sdr ON public.followup_tasks(assigned_sdr);
CREATE INDEX IF NOT EXISTS idx_followup_tasks_status ON public.followup_tasks(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_project_id ON public.system_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
