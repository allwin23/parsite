import type { Project, Prompt } from '../types/database';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Frontend Architecture',
    description: 'React, Next.js, UI/UX systems & performance',
    color: '#3b82f6',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    prompt_count: 2,
  },
  {
    id: 'proj-2',
    name: 'Backend & APIs',
    description: 'Node.js, PostgreSQL, API design & security',
    color: '#10b981',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    prompt_count: 2,
  },
  {
    id: 'proj-3',
    name: 'DevOps & Tooling',
    description: 'Docker, GitHub Actions, CI/CD, and Cloud scripts',
    color: '#8b5cf6',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    prompt_count: 1,
  },
  {
    id: 'proj-4',
    name: 'Machine Learning & LLMs',
    description: 'Prompt engineering, eval harnesses & embeddings',
    color: '#f59e0b',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    prompt_count: 1,
  },
];

export const INITIAL_PROMPTS: Prompt[] = [
  {
    id: 'prompt-1',
    project_id: 'proj-1',
    title: 'React Component Refactor & Accessibility',
    content: `Refactor the following React TypeScript component to:
1. Ensure full WCAG 2.1 AA accessibility (proper ARIA attributes, keyboard navigation, focus trap if modal).
2. Eliminate redundant re-renders using useMemo/useCallback where appropriate.
3. Decouple presentation from business logic using custom hooks.
4. Provide unit tests using Vitest and React Testing Library.

Component:
\`\`\`tsx
// Paste component here
\`\`\``,
    task_tag: 'Refactor',
    is_favorite: true,
    usage_count: 12,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'prompt-2',
    project_id: 'proj-1',
    title: 'Tailwind Responsive Layout Audit',
    content: `Review this HTML/JSX layout for responsive issues. Identify any overflow bugs on mobile viewports (<375px), recommend flexbox/grid layout cleanups, and replace arbitrary Tailwind values with standard design system scale tokens.`,
    task_tag: 'Code Review',
    is_favorite: false,
    usage_count: 4,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'prompt-3',
    project_id: 'proj-2',
    title: 'PostgreSQL Query Optimization & EXPLAIN',
    content: `Analyze this slow SQL query. Given the table schemas and row estimates, recommend:
1. Necessary composite or partial indexes with clear rationale.
2. Query rewrite strategies (e.g. replacing correlated subqueries with CTEs or window functions).
3. How to verify performance improvements using EXPLAIN (ANALYZE, BUFFERS).

Query:
\`\`\`sql
-- Paste query here
\`\`\``,
    task_tag: 'SQL',
    is_favorite: true,
    usage_count: 18,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'prompt-4',
    project_id: 'proj-2',
    title: 'FastAPI / Express Production Error Handler',
    content: `Implement an enterprise-grade error handling middleware that captures unhandled exceptions, sanitizes sensitive stack traces in production, logs correlation IDs for distributed tracing, and returns RFC 7807 compliant Problem Details JSON.`,
    task_tag: 'Debugging',
    is_favorite: false,
    usage_count: 7,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prompt-5',
    project_id: 'proj-3',
    title: 'Multi-Stage Dockerfile Hardening',
    content: `Write an optimized, secure multi-stage Dockerfile for a Node.js/Next.js application.
Requirements:
1. Run as a non-root user (e.g., nodejs:nodejs).
2. Leverage BuildKit cache mounts for package dependencies.
3. Minimize image size with alpine/distroless base.
4. Include clean HEALTHCHECK directive and dumb-init.`,
    task_tag: 'DevOps',
    is_favorite: false,
    usage_count: 9,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prompt-6',
    project_id: 'proj-4',
    title: 'System Prompt Architecture for Structured JSON Output',
    content: `You are an expert LLM engineer. Write a system prompt that enforces strict adherence to a specific JSON schema without markdown backticks or commentary. Include few-shot examples and failure recovery instructions if missing required fields.`,
    task_tag: 'Architecture',
    is_favorite: true,
    usage_count: 24,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];
