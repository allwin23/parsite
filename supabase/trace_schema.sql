-- ==============================================================================
-- Trace Assist - Database Schema Migration
-- Run this in your Supabase SQL Editor to enable high-volume CLI Trace generation
-- ==============================================================================

-- 1. Create `trace_days` (Date Folders)
CREATE TABLE IF NOT EXISTS public.trace_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_label TEXT NOT NULL UNIQUE DEFAULT to_char(now(), 'YYYY-MM-DD'),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create `trace_sessions` (Individual CLI Task Chats inside a Day Folder)
CREATE TABLE IF NOT EXISTS public.trace_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES public.trace_days(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    initial_prompt TEXT NOT NULL,
    notes TEXT DEFAULT '' NOT NULL,
    turn_count INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'warming' NOT NULL CHECK (status IN ('warming', 'ready', 'active', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Create `trace_messages` (Turn-by-Turn Chat History)
CREATE TABLE IF NOT EXISTS public.trace_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.trace_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Create `trace_bulletin_items` (Pre-Generated Turn Prompt Queue per Session)
CREATE TABLE IF NOT EXISTS public.trace_bulletin_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.trace_sessions(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    is_used BOOLEAN DEFAULT false NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_trace_days_label ON public.trace_days(day_label DESC);
CREATE INDEX IF NOT EXISTS idx_trace_sessions_day_id ON public.trace_sessions(day_id);
CREATE INDEX IF NOT EXISTS idx_trace_sessions_status ON public.trace_sessions(status);
CREATE INDEX IF NOT EXISTS idx_trace_messages_session_id ON public.trace_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_trace_bulletin_session_id ON public.trace_bulletin_items(session_id, position ASC);

-- 6. Trigger for `trace_sessions.updated_at`
CREATE OR REPLACE FUNCTION public.handle_trace_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_trace_sessions_updated_at ON public.trace_sessions;
CREATE TRIGGER set_trace_sessions_updated_at
    BEFORE UPDATE ON public.trace_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_trace_session_updated_at();

-- 7. Row Level Security (RLS) Setup
ALTER TABLE public.trace_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trace_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trace_bulletin_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Permissive access to trace_days" ON public.trace_days;
DROP POLICY IF EXISTS "Permissive access to trace_sessions" ON public.trace_sessions;
DROP POLICY IF EXISTS "Permissive access to trace_messages" ON public.trace_messages;
DROP POLICY IF EXISTS "Permissive access to trace_bulletin_items" ON public.trace_bulletin_items;

-- Single-user personal access policies (allows anon & authenticated)
CREATE POLICY "Permissive access to trace_days"
    ON public.trace_days FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Permissive access to trace_sessions"
    ON public.trace_sessions FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Permissive access to trace_messages"
    ON public.trace_messages FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Permissive access to trace_bulletin_items"
    ON public.trace_bulletin_items FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);
