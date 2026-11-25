-- ==============================================================================
-- PromptVault - Database Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create `projects` Table (Folders)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create `prompts` Table (Prompt Cards inside Folders)
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    task_tag TEXT,
    is_favorite BOOLEAN DEFAULT false NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON public.prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_prompts_task_tag ON public.prompts(task_tag);
CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON public.prompts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at ASC);

-- 4. Automatic `updated_at` Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_prompts_updated_at ON public.prompts;
CREATE TRIGGER set_prompts_updated_at
    BEFORE UPDATE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS) Setup
-- Enable RLS on both tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Permissive access to projects for personal usage" ON public.projects;
DROP POLICY IF EXISTS "Permissive access to prompts for personal usage" ON public.prompts;

-- Single-user personal access policies (allows anon & authenticated read/write)
CREATE POLICY "Permissive access to projects for personal usage"
    ON public.projects
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permissive access to prompts for personal usage"
    ON public.prompts
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- (Optional) If you enable Supabase Auth in the future and add user_id column:
-- ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- ALTER TABLE public.prompts ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- Then adjust policies using (auth.uid() = user_id).

-- 6. Seed Initial Data (Helpful Starter Prompts)
DO $$
DECLARE
    p_frontend UUID;
    p_backend UUID;
    p_devops UUID;
BEGIN
    -- Only seed if projects table is completely empty
    IF NOT EXISTS (SELECT 1 FROM public.projects LIMIT 1) THEN
        INSERT INTO public.projects (id, name, description, color)
        VALUES 
            (gen_random_uuid(), 'Frontend Architecture', 'React, Next.js, UI/UX systems & performance', '#3b82f6')
        RETURNING id INTO p_frontend;

        INSERT INTO public.projects (id, name, description, color)
        VALUES 
            (gen_random_uuid(), 'Backend & APIs', 'Node.js, PostgreSQL, API design & security', '#10b981')
        RETURNING id INTO p_backend;

        INSERT INTO public.projects (id, name, description, color)
        VALUES 
            (gen_random_uuid(), 'DevOps & Tooling', 'Docker, GitHub Actions, CI/CD, and Cloud scripts', '#8b5cf6')
        RETURNING id INTO p_devops;

        -- Seed Prompts for Frontend
        INSERT INTO public.prompts (project_id, title, content, task_tag, is_favorite, usage_count)
        VALUES
            (p_frontend, 'React Component Refactor & Accessibility', 'Refactor the following React TypeScript component to:
1. Ensure full WCAG 2.1 AA accessibility (proper ARIA attributes, keyboard navigation, focus trap if modal).
2. Eliminate redundant re-renders using useMemo/useCallback where appropriate.
3. Decouple presentation from business logic using custom hooks.
4. Provide unit tests using Vitest and React Testing Library.

Component:
```tsx
// Paste component here
```', 'Refactor', true, 12),
            (p_frontend, 'Tailwind Responsive Layout Audit', 'Review this HTML/JSX layout for responsive issues. Identify any overflow bugs on mobile viewports (<375px), recommend flexbox/grid layout cleanups, and replace arbitrary Tailwind values with standard design system scale tokens.', 'Code Review', false, 4);

        -- Seed Prompts for Backend
        INSERT INTO public.prompts (project_id, title, content, task_tag, is_favorite, usage_count)
        VALUES
            (p_backend, 'PostgreSQL Query Optimization & EXPLAIN', 'Analyze this slow SQL query. Given the table schemas and row estimates, recommend:
1. Necessary composite or partial indexes with clear rationale.
2. Query rewrite strategies (e.g. replacing correlated subqueries with CTEs or window functions).
3. How to verify performance improvements using EXPLAIN (ANALYZE, BUFFERS).

Query:
```sql
-- Paste query here
```', 'SQL', true, 18),
            (p_backend, 'FastAPI / Express Production Error Handler', 'Implement an enterprise-grade error handling middleware that captures unhandled exceptions, sanitizes sensitive stack traces in production, logs correlation IDs for distributed tracing, and returns RFC 7807 compliant Problem Details JSON.', 'Debugging', false, 7);

        -- Seed Prompts for DevOps
        INSERT INTO public.prompts (project_id, title, content, task_tag, is_favorite, usage_count)
        VALUES
            (p_devops, 'Multi-Stage Dockerfile Hardening', 'Write an optimized, secure multi-stage Dockerfile for a Node.js/Next.js application.
Requirements:
1. Run as a non-root user (e.g., nodejs:nodejs).
2. Leverage BuildKit cache mounts for package dependencies.
3. Minimize image size with alpine/distroless base.
4. Include clean HEALTHCHECK directive and dumb-init.', 'DevOps', false, 9);
    END IF;
END $$;
