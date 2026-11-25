export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
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

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prompts: {
        Row: Prompt;
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          content: string;
          task_tag?: string | null;
          is_favorite?: boolean;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          content?: string;
          task_tag?: string | null;
          is_favorite?: boolean;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prompts_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
