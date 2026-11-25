# PromptVault & Trace Assist ⚡

A high-performance, minimalist developer web application built with **Vite (React + TypeScript)**, **Tailwind CSS v4 (`@tailwindcss/vite`)**, **Lucide React**, **Supabase (`@supabase/supabase-js`)**, and the **Google Gen AI JavaScript SDK (`@google/genai`)**.

PromptVault offers two dedicated top-level workspaces:
1. **Prompt Library:** A zero-bloat personal repository for reusable AI engineering prompts across projects.
2. **Trace Assist:** High-volume CLI trace generation module designed for 30–50 parallel sessions per day with 10–20 turns per session using `gemini-4-hydrogen` or `gemini-3.5-flash-lite`.

---

## ✨ Workspace Overview

### 1. 📚 Prompt Library
- **Two-Level Hierarchy:** "All Prompts", "Favorites", and custom color-accented Project Folders with prompt count badges.
- **Instant Search (`Cmd/Ctrl + K`):** Real-time search across titles, content, tags, and project names.
- **Dynamic Tag Filter Pills:** Filter by `#Refactor`, `#SQL`, `#Debugging`, `#Architecture`, etc.
- **1-Click Copy Workflows:** 1-click clipboard copy with checkmark feedback and automatic usage count tracking.
- **Distraction-Free Editor Modal:** Monospace/sans toggle, live word/char counters, and cross-project prompt duplication.

### 2. ⚡ Trace Assist (CLI Trace Generation)
- **Date Folders (`trace_days`):** Automatic daily date folder tree (`YYYY-MM-DD`) with 2-step permanent day wipe.
- **Bulk JSON Session Launcher:**
  - Paste either key-value objects (`{ "task-name": "prompt text" }`) or arrays (`[{ "task_name": "...", "prompt": "..." }]`).
  - Launches 30–50 sessions immediately in `status = 'warming'`.
  - **5-Worker Concurrency Pool:** Sends initial prompts to Gemini with automatic backoff retry, saves assistant response, and auto-queues first turn in the bulletin.
- **Turn Bulletin Queue:**
  - Compact pre-generated turn cards (`#1`, `#2`, `#3`...) to queue future turns while waiting on CLI runs.
  - 1-click copy marks `is_used = true` and increments session `turn_count`.
- **Chat Stream & Quick Steering Templates:**
  - Turn-by-turn stream with sliding-window context (pinned `initial_prompt` Turn 1 + most recent 10 messages).
  - Every assistant turn includes **1-Click Copy** and **+ Save to Bulletin**.
  - `+` button in composer opens quick steering templates with custom template creator persisted in `localStorage`.
- **"Notes to Remember" Scratchpad:**
  - Collapsible side panel with 500ms debounced autosave to `trace_sessions.notes`.
  - **Strict Rule:** Notes are strictly local reference and **never** auto-injected into Gemini calls.

---

## 🗄️ Database Schemas

- **Prompt Library:** [`supabase/schema.sql`](./supabase/schema.sql) (`projects`, `prompts`)
- **Trace Assist:** [`supabase/trace_schema.sql`](./supabase/trace_schema.sql) (`trace_days`, `trace_sessions`, `trace_messages`, `trace_bulletin_items` with cascading deletes)

---

## 🚀 Quickstart

```bash
# Navigate to project folder
cd parsite

# Start Vite dev server
npm run dev
```

### Environment Variables (.env)
```env
# Supabase (optional for cloud sync)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini API Key (optional in .env; can also be set in app Settings)
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

---

## ⌨️ Shortcuts & Hotkeys

- <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> : Quick search in Prompt Library & Trace Assist.
- <kbd>Enter</kbd> : Send turn prompt in Chat composer.
- <kbd>Shift</kbd> + <kbd>Enter</kbd> : New line in composer.
