import { supabase, isSupabaseConfigured } from './supabase';
import type {
  TraceDay,
  TraceSession,
  TraceMessage,
  TraceBulletinItem,
  CreateTraceSessionInput,
} from '../types/database';

const STORAGE_DAYS_KEY = 'promptvault_trace_days';
const STORAGE_SESSIONS_KEY = 'promptvault_trace_sessions';
const STORAGE_MESSAGES_KEY = 'promptvault_trace_messages';
const STORAGE_BULLETIN_KEY = 'promptvault_trace_bulletin';

export function getTodayDateLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ----------------------------------------------------------------------------
// Local Storage Fallback Helpers
// ----------------------------------------------------------------------------

function getLocalDays(): TraceDay[] {
  try {
    const raw = localStorage.getItem(STORAGE_DAYS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalDays(days: TraceDay[]) {
  try {
    localStorage.setItem(STORAGE_DAYS_KEY, JSON.stringify(days));
  } catch (e) {
    console.error(e);
  }
}

function getLocalSessions(): TraceSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: TraceSession[]) {
  try {
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error(e);
  }
}

function getLocalMessages(): TraceMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalMessages(msgs: TraceMessage[]) {
  try {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(msgs));
  } catch (e) {
    console.error(e);
  }
}

function getLocalBulletin(): TraceBulletinItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_BULLETIN_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalBulletin(items: TraceBulletinItem[]) {
  try {
    localStorage.setItem(STORAGE_BULLETIN_KEY, JSON.stringify(items));
  } catch (e) {
    console.error(e);
  }
}

// ----------------------------------------------------------------------------
// TRACE DAYS API
// ----------------------------------------------------------------------------

export async function fetchTraceDays(): Promise<TraceDay[]> {
  const todayLabel = getTodayDateLabel();

  if (!isSupabaseConfigured) {
    let days = getLocalDays();
    const sessions = getLocalSessions();

    // Auto-create today if missing
    let today = days.find((d) => d.day_label === todayLabel);
    if (!today) {
      today = {
        id: 'day-' + Math.random().toString(36).substring(2, 9),
        day_label: todayLabel,
        created_at: new Date().toISOString(),
        session_count: 0,
      };
      days = [today, ...days];
      saveLocalDays(days);
    }

    // Attach session counts
    const countMap: Record<string, number> = {};
    sessions.forEach((s) => {
      countMap[s.day_id] = (countMap[s.day_id] || 0) + 1;
    });

    return days.map((d) => ({
      ...d,
      session_count: countMap[d.id] || 0,
    }));
  }

  try {
    const { data: days, error } = await supabase
      .from('trace_days')
      .select('*')
      .order('day_label', { ascending: false });

    if (error) throw error;

    let list = (days as TraceDay[]) || [];
    let today = list.find((d) => d.day_label === todayLabel);

    if (!today) {
      const { data: created, error: createError } = await supabase
        .from('trace_days')
        .insert([{ day_label: todayLabel }])
        .select()
        .single();
      if (!createError && created) {
        list = [created as TraceDay, ...list];
      }
    }

    // Fetch counts
    const { data: sess } = await supabase.from('trace_sessions').select('id, day_id');
    const countMap: Record<string, number> = {};
    ((sess as Array<{ day_id: string }>) || []).forEach((s) => {
      countMap[s.day_id] = (countMap[s.day_id] || 0) + 1;
    });

    return list.map((d) => ({
      ...d,
      session_count: countMap[d.id] || 0,
    }));
  } catch (err) {
    console.warn('Supabase fetch trace days error, using local storage:', err);
    return fetchTraceDaysFallback();
  }
}

function fetchTraceDaysFallback(): TraceDay[] {
  const todayLabel = getTodayDateLabel();
  let days = getLocalDays();
  const sessions = getLocalSessions();
  let today = days.find((d) => d.day_label === todayLabel);
  if (!today) {
    today = {
      id: 'day-' + Math.random().toString(36).substring(2, 9),
      day_label: todayLabel,
      created_at: new Date().toISOString(),
      session_count: 0,
    };
    days = [today, ...days];
    saveLocalDays(days);
  }
  const countMap: Record<string, number> = {};
  sessions.forEach((s) => {
    countMap[s.day_id] = (countMap[s.day_id] || 0) + 1;
  });
  return days.map((d) => ({
    ...d,
    session_count: countMap[d.id] || 0,
  }));
}

export async function createTraceDay(dayLabel: string): Promise<TraceDay> {
  const label = dayLabel.trim() || getTodayDateLabel();
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    let days = getLocalDays();
    const existing = days.find((d) => d.day_label === label);
    if (existing) return existing;

    const newDay: TraceDay = {
      id: 'day-' + Math.random().toString(36).substring(2, 9),
      day_label: label,
      created_at: now,
      session_count: 0,
    };
    days = [newDay, ...days];
    saveLocalDays(days);
    return newDay;
  }

  try {
    // Check if exists
    const { data: existing } = await supabase
      .from('trace_days')
      .select('*')
      .eq('day_label', label)
      .maybeSingle();

    if (existing) return existing as TraceDay;

    const { data, error } = await supabase
      .from('trace_days')
      .insert([{ day_label: label }])
      .select()
      .single();

    if (error) throw error;
    return { ...(data as TraceDay), session_count: 0 };
  } catch (err) {
    console.warn('Supabase create trace day error, using local fallback:', err);
    let days = getLocalDays();
    const existing = days.find((d) => d.day_label === label);
    if (existing) return existing;

    const newDay: TraceDay = {
      id: 'day-' + Math.random().toString(36).substring(2, 9),
      day_label: label,
      created_at: now,
      session_count: 0,
    };
    days = [newDay, ...days];
    saveLocalDays(days);
    return newDay;
  }
}

export async function deleteTraceDay(dayId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const days = getLocalDays().filter((d) => d.id !== dayId);
    const sessions = getLocalSessions();
    const sessionIdsToDelete = new Set(
      sessions.filter((s) => s.day_id === dayId).map((s) => s.id)
    );
    const remainingSessions = sessions.filter((s) => s.day_id !== dayId);
    const remainingMessages = getLocalMessages().filter(
      (m) => !sessionIdsToDelete.has(m.session_id)
    );
    const remainingBulletin = getLocalBulletin().filter(
      (b) => !sessionIdsToDelete.has(b.session_id)
    );

    saveLocalDays(days);
    saveLocalSessions(remainingSessions);
    saveLocalMessages(remainingMessages);
    saveLocalBulletin(remainingBulletin);
    return;
  }

  const { error } = await supabase.from('trace_days').delete().eq('id', dayId);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// TRACE SESSIONS API
// ----------------------------------------------------------------------------

export async function fetchTraceSessions(dayId: string): Promise<TraceSession[]> {
  if (!isSupabaseConfigured) {
    return getLocalSessions()
      .filter((s) => s.day_id === dayId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  try {
    const { data, error } = await supabase
      .from('trace_sessions')
      .select('*')
      .eq('day_id', dayId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as TraceSession[]) || [];
  } catch (err) {
    console.warn('Supabase fetch trace sessions error, using local fallback:', err);
    return getLocalSessions().filter((s) => s.day_id === dayId);
  }
}

export async function createTraceSession(
  input: CreateTraceSessionInput
): Promise<TraceSession> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const newSession: TraceSession = {
      id: 'sess-' + Math.random().toString(36).substring(2, 9),
      day_id: input.day_id,
      task_name: input.task_name.trim(),
      initial_prompt: input.initial_prompt.trim(),
      notes: input.notes?.trim() || '',
      turn_count: 0,
      status: input.status || 'warming',
      created_at: now,
      updated_at: now,
    };
    const sessions = [newSession, ...getLocalSessions()];
    saveLocalSessions(sessions);
    return newSession;
  }

  const { data, error } = await supabase
    .from('trace_sessions')
    .insert([
      {
        day_id: input.day_id,
        task_name: input.task_name.trim(),
        initial_prompt: input.initial_prompt.trim(),
        notes: input.notes?.trim() || '',
        turn_count: 0,
        status: input.status || 'warming',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as TraceSession;
}

export async function updateTraceSession(
  sessionId: string,
  partial: Partial<TraceSession>
): Promise<TraceSession> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const sessions = getLocalSessions().map((s) =>
      s.id === sessionId ? { ...s, ...partial, updated_at: now } : s
    );
    saveLocalSessions(sessions);
    const updated = sessions.find((s) => s.id === sessionId);
    if (!updated) throw new Error('Session not found');
    return updated;
  }

  const { data, error } = await supabase
    .from('trace_sessions')
    .update({ ...partial, updated_at: now })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as TraceSession;
}

export async function deleteTraceSession(sessionId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    saveLocalSessions(getLocalSessions().filter((s) => s.id !== sessionId));
    saveLocalMessages(getLocalMessages().filter((m) => m.session_id !== sessionId));
    saveLocalBulletin(getLocalBulletin().filter((b) => b.session_id !== sessionId));
    return;
  }

  const { error } = await supabase.from('trace_sessions').delete().eq('id', sessionId);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// TRACE MESSAGES API
// ----------------------------------------------------------------------------

export async function fetchTraceMessages(sessionId: string): Promise<TraceMessage[]> {
  if (!isSupabaseConfigured) {
    return getLocalMessages()
      .filter((m) => m.session_id === sessionId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  try {
    const { data, error } = await supabase
      .from('trace_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as TraceMessage[]) || [];
  } catch (err) {
    console.warn('Supabase fetch messages error, using local fallback:', err);
    return getLocalMessages().filter((m) => m.session_id === sessionId);
  }
}

export async function createTraceMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<TraceMessage> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const newMsg: TraceMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      session_id: sessionId,
      role,
      content: content.trim(),
      created_at: now,
    };
    const msgs = [...getLocalMessages(), newMsg];
    saveLocalMessages(msgs);
    return newMsg;
  }

  const { data, error } = await supabase
    .from('trace_messages')
    .insert([
      {
        session_id: sessionId,
        role,
        content: content.trim(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as TraceMessage;
}

// ----------------------------------------------------------------------------
// TRACE BULLETIN ITEMS API
// ----------------------------------------------------------------------------

export async function fetchTraceBulletin(sessionId: string): Promise<TraceBulletinItem[]> {
  if (!isSupabaseConfigured) {
    return getLocalBulletin()
      .filter((b) => b.session_id === sessionId)
      .sort((a, b) => a.position - b.position);
  }

  try {
    const { data, error } = await supabase
      .from('trace_bulletin_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('position', { ascending: true });

    if (error) throw error;
    return (data as TraceBulletinItem[]) || [];
  } catch (err) {
    console.warn('Supabase fetch bulletin error, using local fallback:', err);
    return getLocalBulletin().filter((b) => b.session_id === sessionId);
  }
}

export async function createTraceBulletinItem(
  sessionId: string,
  promptText: string,
  position = 0
): Promise<TraceBulletinItem> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const newItem: TraceBulletinItem = {
      id: 'bult-' + Math.random().toString(36).substring(2, 9),
      session_id: sessionId,
      prompt_text: promptText.trim(),
      is_used: false,
      position,
      created_at: now,
    };
    const items = [...getLocalBulletin(), newItem];
    saveLocalBulletin(items);
    return newItem;
  }

  const { data, error } = await supabase
    .from('trace_bulletin_items')
    .insert([
      {
        session_id: sessionId,
        prompt_text: promptText.trim(),
        position,
        is_used: false,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as TraceBulletinItem;
}

export async function updateTraceBulletinItem(
  id: string,
  partial: Partial<TraceBulletinItem>
): Promise<TraceBulletinItem> {
  if (!isSupabaseConfigured) {
    const items = getLocalBulletin().map((b) => (b.id === id ? { ...b, ...partial } : b));
    saveLocalBulletin(items);
    const updated = items.find((b) => b.id === id);
    if (!updated) throw new Error('Bulletin item not found');
    return updated;
  }

  const { data, error } = await supabase
    .from('trace_bulletin_items')
    .update(partial)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TraceBulletinItem;
}

export async function deleteTraceBulletinItem(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    saveLocalBulletin(getLocalBulletin().filter((b) => b.id !== id));
    return;
  }

  const { error } = await supabase.from('trace_bulletin_items').delete().eq('id', id);
  if (error) throw error;
}
