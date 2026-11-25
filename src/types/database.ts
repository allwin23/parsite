export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ----------------------------------------------------------------------------
// Prompt Library Types
// ----------------------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  system_prompt?: string | null;
  created_at: string;
  updated_at: string;
  prompt_count?: number;
}

export interface Prompt {
  id: string;
  project_id: string;
  title: string;
  content: string;
  task_tag: string | null;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  project?: Project;
}

export type CreateProjectInput = {
  name: string;
  description?: string;
  color?: string;
  system_prompt?: string | null;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

export type CreatePromptInput = {
  project_id: string;
  title: string;
  content: string;
  task_tag?: string;
  is_favorite?: boolean;
};

export type UpdatePromptInput = Partial<CreatePromptInput>;

// ----------------------------------------------------------------------------
// Trace Assist Types
// ----------------------------------------------------------------------------

export type TraceSessionStatus = 'warming' | 'ready' | 'active' | 'completed';

export interface TraceDay {
  id: string;
  day_label: string; // e.g. "2026-11-25"
  system_prompt?: string | null;
  created_at: string;
  session_count?: number;
}

export type CreateTraceDayInput = {
  day_label: string;
  system_prompt?: string | null;
};

export type UpdateTraceDayInput = Partial<CreateTraceDayInput>;

export interface TraceSession {
  id: string;
  day_id: string;
  task_name: string;
  initial_prompt: string;
  notes: string;
  turn_count: number;
  status: TraceSessionStatus;
  created_at: string;
  updated_at: string;
  messages?: TraceMessage[];
  bulletin_items?: TraceBulletinItem[];
}

export interface TraceMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface TraceBulletinItem {
  id: string;
  session_id: string;
  prompt_text: string;
  is_used: boolean;
  position: number;
  created_at: string;
}

export interface CreateTraceSessionInput {
  day_id: string;
  task_name: string;
  initial_prompt: string;
  notes?: string;
  status?: TraceSessionStatus;
}

export interface BatchTaskItem {
  task_name: string;
  prompt: string;
}

// ----------------------------------------------------------------------------
// Supabase Database Typing (Flexible for direct Client usage)
// ----------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Partial<Project> & { name: string };
        Update: Partial<Project>;
      };
      prompts: {
        Row: Prompt;
        Insert: Partial<Prompt> & { project_id: string; title: string; content: string };
        Update: Partial<Prompt>;
      };
      trace_days: {
        Row: TraceDay;
        Insert: Partial<TraceDay> & { day_label: string };
        Update: Partial<TraceDay>;
      };
      trace_sessions: {
        Row: TraceSession;
        Insert: Partial<TraceSession> & { day_id: string; task_name: string; initial_prompt: string };
        Update: Partial<TraceSession>;
      };
      trace_messages: {
        Row: TraceMessage;
        Insert: Partial<TraceMessage> & { session_id: string; role: 'user' | 'assistant'; content: string };
        Update: Partial<TraceMessage>;
      };
      trace_bulletin_items: {
        Row: TraceBulletinItem;
        Insert: Partial<TraceBulletinItem> & { session_id: string; prompt_text: string };
        Update: Partial<TraceBulletinItem>;
      };
    };
  };
}
