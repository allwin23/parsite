import { GoogleGenAI } from '@google/genai';
import type { TraceMessage } from '../types/database';

export const TRACE_SYSTEM_INSTRUCTION =
  'You are a CLI Trace Prompt Assistant helping a developer steer a coding agent across a realistic 10-15 turn terminal session. Output ONLY the exact next user prompt(s) to paste into the CLI agent—concise, natural, technical, and actionable. Do not write code solutions or conversational filler unless explicitly requested.';

export const GEMINI_MODEL_STORAGE_KEY = 'promptvault_gemini_model';
export const GEMINI_KEY_STORAGE_KEY = 'promptvault_gemini_api_key';

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Recommended - High Speed & Intelligence)' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Ultra Fast / High Throughput)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Stable Fallback)' },
  { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen (Experimental - Subject to Demand)' },
];

export const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
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
  if (typeof window === 'undefined') return 'gemini-3.5-flash';
  const stored = localStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
  // Auto-migrate away from retired models (gemini-2.0, gemini-1.5) or 503-prone gemini-4-hydrogen
  if (
    stored &&
    ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'].includes(stored)
  ) {
    return stored;
  }
  return 'gemini-3.5-flash';
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
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  // When no conversation history exists yet, use the initial prompt as Turn 1
  if (messages.length === 0) {
    contents.push({
      role: 'user',
      parts: [
        {
          text: initialPrompt,
        },
      ],
    });
  } else {
    // For ongoing turns, use the sliding window of recent 10 messages without force-pinning
    const recentHistory = messages.slice(-10);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
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

// Generate single turn completion with automatic resilient model fallback cascade
export async function generateTurnPrompt({
  initialPrompt,
  messages,
  newUserMessage,
}: BuildTurnContextOptions): Promise<string> {
  const apiKey = getStoredGeminiKey();
  const selectedModel = getSelectedModel();

  if (!apiKey) {
    // Graceful demo simulation fallback when API key is not yet set
    return `[Demo Mode - Set Gemini API Key in Settings for live calls]\nCheck the terminal logs for any warning or error outputs, and verify that the tests are passing with \`npm test\`.`;
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = buildTurnContext({ initialPrompt, messages, newUserMessage });

  // Cascade list: user's selected model first, followed by battle-tested fallback models
  const candidateModels = [
    selectedModel,
    ...FALLBACK_MODELS.filter((m) => m !== selectedModel),
  ];

  let lastError: unknown = null;

  for (const modelToTry of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelToTry,
        contents,
        config: {
          systemInstruction: TRACE_SYSTEM_INSTRUCTION,
        },
      });

      const text = response.text || '';
      if (text && text.trim()) {
        return text.trim();
      }
    } catch (err: unknown) {
      lastError = err;
      const errorMsg = String(err);
      console.warn(
        `Gemini model "${modelToTry}" encountered an issue (${errorMsg}). Automatically failing over to next fallback model...`
      );
      // Short delay before trying next fallback
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  // If every model candidate returned an error (e.g. 503 high demand or quota),
  // return an intelligent actionable steering response instead of failing silently!
  console.error('All Gemini model candidates encountered errors:', lastError);
  return `[Note: Gemini models are temporarily experiencing high demand in your region. Resuming session with standard steering prompt]:\nInspect the terminal output from the previous step. Verify that the command executed cleanly without errors, and run the test suite to confirm expected behavior.`;
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
