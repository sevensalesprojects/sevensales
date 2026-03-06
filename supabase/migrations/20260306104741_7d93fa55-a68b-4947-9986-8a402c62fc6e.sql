
-- Onboarding process table
CREATE TABLE public.onboarding_process (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'etapa_inicial',
  assigned_user uuid,
  purchase_date timestamp with time zone,
  scheduled_call_date timestamp with time zone,
  call_link text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Onboarding history table
CREATE TABLE public.onboarding_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id uuid REFERENCES public.onboarding_process(id) ON DELETE CASCADE NOT NULL,
  stage_from text,
  stage_to text NOT NULL,
  changed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Onboarding checklist items
CREATE TABLE public.onboarding_checklist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id uuid REFERENCES public.onboarding_process(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  completed_by uuid,
  position integer NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.onboarding_process ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;

-- RLS policies for onboarding_process
CREATE POLICY "Admins can manage onboarding" ON public.onboarding_process FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users with project access can view onboarding" ON public.onboarding_process FOR SELECT USING (has_project_access(auth.uid(), project_id));
CREATE POLICY "Assigned users can update onboarding" ON public.onboarding_process FOR UPDATE USING (assigned_user = auth.uid());

-- RLS policies for onboarding_history
CREATE POLICY "Admins can manage onboarding history" ON public.onboarding_history FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view onboarding history" ON public.onboarding_history FOR SELECT USING (
  onboarding_id IN (SELECT id FROM public.onboarding_process WHERE has_project_access(auth.uid(), project_id))
);
CREATE POLICY "Users can insert onboarding history" ON public.onboarding_history FOR INSERT WITH CHECK (changed_by = auth.uid());

-- RLS policies for onboarding_checklist
CREATE POLICY "Admins can manage checklist" ON public.onboarding_checklist FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view checklist" ON public.onboarding_checklist FOR SELECT USING (
  onboarding_id IN (SELECT id FROM public.onboarding_process WHERE has_project_access(auth.uid(), project_id))
);
CREATE POLICY "Users can update checklist" ON public.onboarding_checklist FOR UPDATE USING (
  onboarding_id IN (SELECT id FROM public.onboarding_process WHERE has_project_access(auth.uid(), project_id))
);

-- Trigger for updated_at
CREATE TRIGGER update_onboarding_updated_at BEFORE UPDATE ON public.onboarding_process
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.onboarding_process;
