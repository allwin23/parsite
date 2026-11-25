import { GoogleGenAI } from '@google/genai';
import type { TraceMessage } from '../types/database';

export const TRACE_SYSTEM_INSTRUCTION =
  'You are a CLI Trace Prompt Assistant helping a developer steer a coding agent across a realistic 10-15 turn terminal session. Output ONLY the exact next user prompt(s) to paste into the CLI agent—concise, natural, technical, and actionable. Do not write code solutions or conversational filler unless explicitly requested.';

export const GEMINI_MODEL_STORAGE_KEY = 'promptvault_gemini_model';
export const GEMINI_KEY_STORAGE_KEY = 'promptvault_gemini_api_key';

export const AVAILABLE_MODELS = [
  { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen (Recommended for Traces)' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (High Speed / Budget)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
];

export function getStoredGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(GEMINI_KEY_STORAGE_KEY);
  if (stored && stored.trim()) return stored.trim();
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && !envKey.includes('your-gemini-api-key')) {
    return envKey.trim();
  }
  return '';
}

export function setStoredGeminiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GEMINI_KEY_STORAGE_KEY, key.trim());
  }
}

export function getSelectedModel(): string {
  if (typeof window === 'undefined') return 'gemini-4-hydrogen';
  const stored = localStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
  return stored || 'gemini-4-hydrogen';
}

export function setSelectedModel(model: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, model);
  }
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getStoredGeminiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export interface BuildTurnContextOptions {
  initialPrompt: string;
  messages: TraceMessage[];
  newUserMessage?: string;
}

export function buildTurnContext({
  initialPrompt,
  messages,
  newUserMessage,
}: BuildTurnContextOptions) {
  // Strategy:
  // 1. Initial Prompt is always Turn 1 context
  // 2. Sliding window: only the most recent 10 messages from trace_messages
  const recentHistory = messages.slice(-10);

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  // Pinned Initial Prompt as Turn 1
  contents.push({
    role: 'user',
    parts: [
      {
        text: `[Initial Task Description]:\n${initialPrompt}`,
      },
    ],
  });

  // Recent 10 turns
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  // If a new user message is provided that hasn't yet been committed to history
  if (newUserMessage && newUserMessage.trim()) {
    contents.push({
      role: 'user',
      parts: [{ text: newUserMessage.trim() }],
    });
  }

  return contents;
}

// Generate single turn completion
export async function generateTurnPrompt({
  initialPrompt,
  messages,
  newUserMessage,
}: BuildTurnContextOptions): Promise<string> {
  const apiKey = getStoredGeminiKey();
  const model = getSelectedModel();

  if (!apiKey) {
    // Graceful demo simulation fallback when API key is not yet set
    return `[Demo Mode - Set Gemini API Key in Settings for live calls]\nCheck the terminal logs for any warning or error outputs, and verify that the tests are passing with \`npm test\`.`;
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = buildTurnContext({ initialPrompt, messages, newUserMessage });

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: TRACE_SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text || '';
    return text.trim();
  } catch (err: unknown) {
    const errorMsg = String(err);
    // If the experimental model is not found, fallback to gemini-2.5-flash
    if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('ResourceExhausted')) {
      console.warn(`Model ${model} returned error, trying fallback model gemini-2.5-flash...`, err);
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: TRACE_SYSTEM_INSTRUCTION,
          },
        });
        return (fallbackResponse.text || '').trim();
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
    throw err;
  }
}

// ----------------------------------------------------------------------------
// Concurrency-Limited Batch Worker Pool (Max 5 concurrent workers)
// ----------------------------------------------------------------------------

export interface BatchItemJob<T> {
  item: T;
  execute: () => Promise<void>;
}

export async function runWithConcurrency<T>(
  items: T[],
  workerFn: (item: T, index: number) => Promise<void>,
  concurrencyLimit = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  let activeCount = 0;
  let currentIndex = 0;
  let completedCount = 0;
  const total = items.length;

  return new Promise<void>((resolve) => {
    if (total === 0) {
      resolve();
      return;
    }

    function next() {
      if (completedCount === total) {
        resolve();
        return;
      }

      while (activeCount < concurrencyLimit && currentIndex < total) {
        const index = currentIndex++;
        const item = items[index];
        activeCount++;

        // Execute task with retry logic
        executeWithRetry(async () => workerFn(item, index), 2, 800)
          .catch((err) => {
            console.error(`Batch worker error at item ${index}:`, err);
          })
          .finally(() => {
            activeCount--;
            completedCount++;
            if (onProgress) {
              onProgress(completedCount, total);
            }
            next();
          });
      }
    }

    next();
  });
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((r) => setTimeout(r, delayMs));
    return executeWithRetry(fn, retries - 1, delayMs * 1.5);
  }
}
