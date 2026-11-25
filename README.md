# PromptVault ⚡

A clean, fast, minimalist personal **AI Prompt Library** web application built with **Vite (React + TypeScript)**, **Tailwind CSS (v4 via `@tailwindcss/vite`)**, **Lucide React**, and **Supabase (`@supabase/supabase-js`)**.

Designed for developers, prompt engineers, and technical leads managing reusable AI prompts across multiple projects with zero bloat and instant 1-click copy-paste workflows.

---

## ✨ Features

- **Two-Level Hierarchy + Global Views:**
  - **All Prompts:** Global workspace displaying all prompts across every project with project badges.
  - **Favorites:** Instant access to starred prompts.
  - **Project Folders:** Filter by project with prompt count badges, custom folder color accents, and hover options.
- **Lightning Search & Tag Filtering:**
  - **Real-Time Search (`Cmd/Ctrl + K`):** Instant fuzzy search across titles, prompt content, task tags, and project names.
  - **Dynamic Tag Filter Pills:** Filter by tags like `#Refactor`, `#SQL`, `#Debugging`, `#Architecture`, `#DevOps` dynamically derived from active prompts.
- **Prompt Cards & 1-Click Workflows:**
  - **1-Click Copy:** Copies prompt to clipboard, shows visual confirmation (`Copied!`), and increments usage counter.
  - **Favorite Star:** Pin/unpin key prompts with optimistic updates.
  - **Body Preview:** Monospace truncated preview (3-4 lines) for fast scanning.
  - **Usage Heat Counter:** See which prompts get copied most often.
- **Distraction-Free Prompt Editor Modal:**
  - Auto-expanding prompt textarea with a **Monospace / Sans-serif** font toggle.
  - Live character and word counters.
  - **Cross-Project Duplication:** Clone any prompt into another project folder without modifying the original.
  - **Safe Deletions:** Two-step confirmation click prevents accidental data loss.
- **Resilient Multi-Mode Storage:**
  - **Supabase Cloud Mode:** When configured, syncs across all devices via PostgreSQL + Row Level Security (RLS).
  - **Local Storage Mode:** If Supabase credentials are not yet supplied, operates seamlessly with mock starter data in `localStorage` and provides a non-intrusive setup banner with guided instructions.
- **Developer Aesthetic & Dark Mode:**
  - High-contrast typography (`Inter` + `JetBrains Mono`).
  - Native dark/light mode toggle with persistent local preference.

---

## 🚀 Quickstart

### 1. Install & Run Dev Server
```bash
# Navigate to the parsite folder
cd parsite

# Start Vite dev server
npm run dev
```

### 2. Connect Supabase (Optional for Cloud Sync)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**. This creates:
   - `public.projects` table with color accents and timestamps.
   - `public.prompts` table with cascade delete foreign keys and usage counters.
   - Row Level Security (RLS) policies for single-user access.
   - Starter prompts for Frontend Architecture, Backend & APIs, and DevOps.
4. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
5. Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
6. Restart your dev server (`npm run dev`). PromptVault will immediately switch from Local Mode to Cloud Supabase Mode!

---

## 🗄️ Database Schema (`supabase/schema.sql`)

### `projects`
| Column | Type | Default | Description |
|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `name` | `text` | *not null* | Project title |
| `description`| `text` | `null` | Short project summary |
| `color` | `text` | `'#3b82f6'` | Hex accent for folder badge |
| `created_at` | `timestamptz` | `now()` | Timestamp |
| `updated_at` | `timestamptz` | `now()` | Auto-updating trigger |

### `prompts`
| Column | Type | Default | Description |
|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `project_id` | `uuid` | *not null* | Foreign Key references `projects(id)` ON DELETE CASCADE |
| `title` | `text` | *not null* | Prompt title |
| `content` | `text` | *not null* | Actual prompt body / instructions |
| `task_tag` | `text` | `null` | Tag (e.g. `SQL`, `Refactor`, `Debugging`) |
| `is_favorite`| `boolean` | `false` | Starred status |
| `usage_count`| `integer` | `0` | Increments on copy |
| `created_at` | `timestamptz` | `now()` | Timestamp |
| `updated_at` | `timestamptz` | `now()` | Auto-updating trigger |

---

## ⌨️ Shortcuts & Hotkeys

- <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> : Focus search input from anywhere.
- <kbd>Esc</kbd> : Blur search or close modals.

---

## 🛠️ Build & Production
```bash
# Type check and build bundle
npm run build

# Preview production build locally
npm run preview
```
