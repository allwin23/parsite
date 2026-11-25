import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Project,
  Prompt,
  CreateProjectInput,
  UpdateProjectInput,
  CreatePromptInput,
  UpdatePromptInput,
} from '../types/database';
import { INITIAL_PROJECTS, INITIAL_PROMPTS } from './mockData';

const STORAGE_PROJECTS_KEY = 'promptvault_projects_local';
const STORAGE_PROMPTS_KEY = 'promptvault_prompts_local';

function getLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROJECTS;
  }
}

function saveLocalProjects(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to localStorage', e);
  }
}

function getLocalPrompts(): Prompt[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROMPTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PROMPTS_KEY, JSON.stringify(INITIAL_PROMPTS));
      return INITIAL_PROMPTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROMPTS;
  }
}

function saveLocalPrompts(prompts: Prompt[]) {
  try {
    localStorage.setItem(STORAGE_PROMPTS_KEY, JSON.stringify(prompts));
  } catch (e) {
    console.error('Failed to save prompts to localStorage', e);
  }
}

// Attach prompt_count to projects
function computePromptCounts(projects: Project[], prompts: Prompt[]): Project[] {
  const counts: Record<string, number> = {};
  prompts.forEach((p) => {
    counts[p.project_id] = (counts[p.project_id] || 0) + 1;
  });
  return projects.map((proj) => ({
    ...proj,
    prompt_count: counts[proj.id] || 0,
  }));
}

// ----------------------------------------------------------------------------
// PROJECTS API
// ----------------------------------------------------------------------------

export async function fetchProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    const projects = getLocalProjects();
    const prompts = getLocalPrompts();
    return computePromptCounts(projects, prompts);
  }

  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch counts from prompts
    const { data: prompts } = await supabase.from('prompts').select('id, project_id');
    return computePromptCounts((projects as Project[]) || [], (prompts as Prompt[]) || []);
  } catch (err) {
    console.warn('Supabase fetch projects error, falling back to local storage:', err);
    const projects = getLocalProjects();
    const prompts = getLocalPrompts();
    return computePromptCounts(projects, prompts);
  }
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const newProject: Project = {
      id: 'proj-' + Math.random().toString(36).substring(2, 9),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      color: input.color || '#3b82f6',
      created_at: now,
      updated_at: now,
      prompt_count: 0,
    };
    const projects = [newProject, ...getLocalProjects()];
    saveLocalProjects(projects);
    return newProject;
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        color: input.color || '#3b82f6',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return { ...(data as Project), prompt_count: 0 };
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const projects = getLocalProjects().map((p) =>
      p.id === id
        ? {
            ...p,
            ...input,
            updated_at: now,
          }
        : p
    );
    saveLocalProjects(projects);
    const updated = projects.find((p) => p.id === id);
    if (!updated) throw new Error('Project not found');
    return updated;
  }

  const { data, error } = await supabase
    .from('projects')
    .update({
      ...input,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const projects = getLocalProjects().filter((p) => p.id !== id);
    const prompts = getLocalPrompts().filter((p) => p.project_id !== id);
    saveLocalProjects(projects);
    saveLocalPrompts(prompts);
    return;
  }

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// PROMPTS API
// ----------------------------------------------------------------------------

export async function fetchPrompts(): Promise<Prompt[]> {
  if (!isSupabaseConfigured) {
    const prompts = getLocalPrompts();
    const projects = getLocalProjects();
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    return prompts.map((pr) => ({
      ...pr,
      project: projectMap.get(pr.project_id),
    }));
  }

  try {
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*, project:projects(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (prompts as unknown as Prompt[]) || [];
  } catch (err) {
    console.warn('Supabase fetch prompts error, falling back to local storage:', err);
    const prompts = getLocalPrompts();
    const projects = getLocalProjects();
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    return prompts.map((pr) => ({
      ...pr,
      project: projectMap.get(pr.project_id),
    }));
  }
}

export async function createPrompt(input: CreatePromptInput): Promise<Prompt> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const newPrompt: Prompt = {
      id: 'prompt-' + Math.random().toString(36).substring(2, 9),
      project_id: input.project_id,
      title: input.title.trim(),
      content: input.content.trim(),
      task_tag: input.task_tag?.trim() || null,
      is_favorite: input.is_favorite ?? false,
      usage_count: 0,
      created_at: now,
      updated_at: now,
    };
    const prompts = [newPrompt, ...getLocalPrompts()];
    saveLocalPrompts(prompts);
    const projects = getLocalProjects();
    newPrompt.project = projects.find((p) => p.id === input.project_id);
    return newPrompt;
  }

  const { data, error } = await supabase
    .from('prompts')
    .insert([
      {
        project_id: input.project_id,
        title: input.title.trim(),
        content: input.content.trim(),
        task_tag: input.task_tag?.trim() || null,
        is_favorite: input.is_favorite ?? false,
        usage_count: 0,
      },
    ])
    .select('*, project:projects(*)')
    .single();

  if (error) throw error;
  return data as unknown as Prompt;
}

export async function updatePrompt(id: string, input: UpdatePromptInput): Promise<Prompt> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const prompts = getLocalPrompts().map((p) =>
      p.id === id
        ? {
            ...p,
            ...input,
            updated_at: now,
          }
        : p
    );
    saveLocalPrompts(prompts);
    const updated = prompts.find((p) => p.id === id);
    if (!updated) throw new Error('Prompt not found');
    const projects = getLocalProjects();
    updated.project = projects.find((pr) => pr.id === updated.project_id);
    return updated;
  }

  const { data, error } = await supabase
    .from('prompts')
    .update({
      ...input,
      updated_at: now,
    })
    .eq('id', id)
    .select('*, project:projects(*)')
    .single();

  if (error) throw error;
  return data as unknown as Prompt;
}

export async function deletePrompt(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const prompts = getLocalPrompts().filter((p) => p.id !== id);
    saveLocalPrompts(prompts);
    return;
  }

  const { error } = await supabase.from('prompts').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementUsageCount(id: string): Promise<number> {
  if (!isSupabaseConfigured) {
    let newCount = 0;
    const prompts = getLocalPrompts().map((p) => {
      if (p.id === id) {
        newCount = (p.usage_count || 0) + 1;
        return { ...p, usage_count: newCount, updated_at: new Date().toISOString() };
      }
      return p;
    });
    saveLocalPrompts(prompts);
    return newCount;
  }

  try {
    // First read current count
    const { data: curr } = await supabase
      .from('prompts')
      .select('usage_count')
      .eq('id', id)
      .single();

    const nextCount = ((curr as { usage_count: number } | null)?.usage_count || 0) + 1;
    await supabase
      .from('prompts')
      .update({ usage_count: nextCount })
      .eq('id', id);
    return nextCount;
  } catch (e) {
    console.error('Failed to increment usage count in Supabase', e);
    return 0;
  }
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const prompts = getLocalPrompts().map((p) =>
      p.id === id ? { ...p, is_favorite: isFavorite, updated_at: new Date().toISOString() } : p
    );
    saveLocalPrompts(prompts);
    return isFavorite;
  }

  const { error } = await supabase
    .from('prompts')
    .update({ is_favorite: isFavorite })
    .eq('id', id);
  if (error) throw error;
  return isFavorite;
}

export async function duplicatePrompt(id: string, targetProjectId: string): Promise<Prompt> {
  const allPrompts = isSupabaseConfigured ? (await fetchPrompts()) : getLocalPrompts();
  const source = allPrompts.find((p) => p.id === id);
  if (!source) throw new Error('Source prompt not found');

  return createPrompt({
    project_id: targetProjectId,
    title: `${source.title} (Copy)`,
    content: source.content,
    task_tag: source.task_tag || undefined,
    is_favorite: source.is_favorite,
  });
}
