
-- Problema #2: Adicionar meeting_url e project_id na tabela calls
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id);

-- Backfill project_id from leads
UPDATE public.calls c
SET project_id = l.project_id
FROM public.leads l
WHERE c.lead_id = l.id AND c.project_id IS NULL;

-- Index for project-based queries
CREATE INDEX IF NOT EXISTS idx_calls_project_id ON public.calls(project_id);

-- RLS policy for service_role on calls (for future edge functions)
CREATE POLICY "Service role full access calls"
  ON public.calls FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
