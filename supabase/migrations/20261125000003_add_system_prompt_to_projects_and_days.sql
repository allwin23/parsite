-- ==============================================================================
-- Add dynamic system_prompt column to trace_days (folders) and projects
-- ==============================================================================

ALTER TABLE public.trace_days
ADD COLUMN IF NOT EXISTS system_prompt TEXT;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS system_prompt TEXT;
