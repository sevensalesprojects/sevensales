
-- ══════════════════════════════════════════════════
-- LOTE 1: Indexes, View, Triggers, Constraints
-- LOTE 3: webhook_queue table, realtime for leads
-- ══════════════════════════════════════════════════

-- 1.1 Composite indexes
CREATE INDEX IF NOT EXISTS idx_leads_project_created ON public.leads(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_project_sdr ON public.leads(project_id, sdr_id);
CREATE INDEX IF NOT EXISTS idx_leads_project_closer ON public.leads(project_id, closer_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_created ON public.messages(lead_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_project_direction ON public.messages(project_id, direction, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_project_scheduled ON public.calls(project_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE is_read = false;

-- 1.2 View leads_enriched (eliminates N+1 queries)
CREATE OR REPLACE VIEW public.leads_enriched AS
SELECT
  l.*,
  sdr.full_name AS sdr_name,
  cls.full_name AS closer_name,
  fs.name AS stage_name,
  fs.color AS stage_color,
  fn.name AS funnel_name,
  fn.type AS funnel_type,
  (
    SELECT json_agg(t.name ORDER BY t.name)
    FROM public.lead_tags lt
    JOIN public.tags t ON t.id = lt.tag_id
    WHERE lt.lead_id = l.id
  ) AS tags_json
FROM public.leads l
LEFT JOIN public.profiles sdr ON l.sdr_id = sdr.user_id
LEFT JOIN public.profiles cls ON l.closer_id = cls.user_id
LEFT JOIN public.funnel_stages fs ON l.stage_id = fs.id
LEFT JOIN public.funnels fn ON l.funnel_id = fn.id;

ALTER VIEW public.leads_enriched SET (security_invoker = true);

-- 1.3 Trigger: auto response_time_minutes
CREATE OR REPLACE FUNCTION public.auto_response_time()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.leads
  SET response_time_minutes = ROUND(
    EXTRACT(EPOCH FROM (now() - created_at)) / 60
  )
  WHERE id = NEW.lead_id
  AND response_time_minutes IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_response_time ON public.messages;
CREATE TRIGGER trg_auto_response_time
AFTER INSERT ON public.messages
FOR EACH ROW
WHEN (NEW.direction = 'outbound')
EXECUTE FUNCTION public.auto_response_time();

-- 1.4 Trigger: touch lead updated_at on new message
CREATE OR REPLACE FUNCTION public.touch_lead_on_message()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.leads
  SET updated_at = now()
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_lead_on_message ON public.messages;
CREATE TRIGGER trg_touch_lead_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_lead_on_message();

-- 1.5 Constraints
DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT chk_qualification_score
  CHECK (qualification_score IS NULL OR qualification_score IN (
    'muito_qualificado', 'qualificado', 'pouco_qualificado', 'desqualificado'
  ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT chk_sale_status
  CHECK (sale_status IS NULL OR sale_status IN (
    'pending', 'sold', 'lost', 'cancelled', 'refunded'
  ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Unique partial indexes for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_external_id ON public.sales(external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_messages_instagram_mid ON public.messages(instagram_message_id) WHERE instagram_message_id IS NOT NULL;

-- 3.3 Webhook queue table
CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  last_error text,
  process_after timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_webhook_queue_pending
ON public.webhook_queue(process_after)
WHERE status IN ('pending', 'failed');

ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "service_role_webhook_queue" ON public.webhook_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enable realtime for leads (needed for Lote 2 realtime UPDATE/DELETE)
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
