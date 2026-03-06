
-- Lead activity logs for tracking all field changes
CREATE TABLE public.lead_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lead activity logs" ON public.lead_activity_logs FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can insert lead activity logs" ON public.lead_activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view lead activity logs" ON public.lead_activity_logs FOR SELECT USING (
  lead_id IN (SELECT id FROM public.leads WHERE has_project_access(auth.uid(), project_id) OR sdr_id = auth.uid() OR closer_id = auth.uid())
);

CREATE INDEX idx_lead_activity_logs_lead_id ON public.lead_activity_logs(lead_id);
CREATE INDEX idx_lead_activity_logs_action ON public.lead_activity_logs(action);
