
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS group_number text,
  ADD COLUMN IF NOT EXISTS group_link text,
  ADD COLUMN IF NOT EXISTS sale_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS scheduling_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS consultation_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reference_month text,
  ADD COLUMN IF NOT EXISTS call_recording_link text,
  ADD COLUMN IF NOT EXISTS observations text,
  ADD COLUMN IF NOT EXISTS scheduling_summary text,
  ADD COLUMN IF NOT EXISTS sdr_evaluation text,
  ADD COLUMN IF NOT EXISTS qualification_score text,
  ADD COLUMN IF NOT EXISTS sdr_observations text,
  ADD COLUMN IF NOT EXISTS google_calendar_event_id text;
