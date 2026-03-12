
-- Correção 5: RLS para service_role nas tabelas de logs
CREATE POLICY "Service role full access system logs"
  ON public.system_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access lead activity logs"
  ON public.lead_activity_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
