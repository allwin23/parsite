import { GoogleGenAI } from '@google/genai';
import type { TraceMessage } from '../types/database';

export const DEFAULT_TRACE_SYSTEM_INSTRUCTION = `You are a CLI Trace Prompt Generator. The user is running an autonomous coding agent in a terminal session (10-20 turns per task) and needs realistic, human-like follow-up prompts to steer the agent step by step until the task is complete.

STRICT OUTPUT RULES:
1. Output ONLY the exact raw prompt text that the user will copy and paste directly into the CLI agent.
2. NEVER include prefixes, labels, or headers (no "Turn 2:", "Next Prompt:", "Here is your prompt:", or markdown quotes/fences around the prompt).
3. NEVER write explanations, commentary, greetings, or code solutions unless the user explicitly asks you to explain something.
4. Keep each prompt natural, concise, and technical—written in first-person developer voice reacting to what the CLI agent just did or missed.
5. Do not solve the whole task in one giant prompt; pace the steering naturally across turns (inspecting -> narrowing down -> implementing -> testing edge cases -> verifying).`;

export const TRACE_SYSTEM_INSTRUCTION = DEFAULT_TRACE_SYSTEM_INSTRUCTION;

export const GLOBAL_SYSTEM_PROMPT_STORAGE_KEY = 'promptvault_global_system_instruction';

export const SYSTEM_PROMPT_PRESETS = [
  {
    id: 'default',
    title: 'Standard CLI Trace Steerer',
    description: 'Human-like realistic developer steering over 10-20 turns',
    instruction: DEFAULT_TRACE_SYSTEM_INSTRUCTION,
  },
  {
    id: 'tdd',
    title: 'Strict TDD & Test-First Verification',
    description: 'Forces agent to locate/write test files and run test suites before editing production code',
    instruction: `You are a Strict TDD CLI Trace Assistant. The user is steering an autonomous coding agent in a terminal. Every prompt MUST steer the agent through rigorous Test-Driven Development:
1. Output ONLY the exact next prompt text to paste into the terminal—no greetings, headers, or quotes.
2. Always insist that the agent write or locate reproducible tests first before touching implementation files.
3. Require the agent to run the test suite and verify test failures before implementing solutions.
4. Keep prompts concise, technical, and written in a direct developer voice.`,
  },
  {
    id: 'security',
    title: 'Security & Bug Hunter',
    description: 'Steers agent to audit edge cases, race conditions, auth bypasses, and sanitization',
    instruction: `You are a Senior Security & Bug Audit CLI Trace Assistant. The user is steering an autonomous agent in a terminal session.
1. Output ONLY the raw prompt text with zero headers, quotes, or conversational filler.
2. Direct the agent to investigate root causes, concurrency races, input sanitization, and security attack vectors.
3. Never give away the full fix; steer the agent step-by-step through discovery, regression test creation, and targeted patching.
4. Use a decisive, technical developer voice.`,
  },
  {
    id: 'concise',
    title: 'Ultra-Minimal Direct Steerer',
    description: '1-sentence terse developer commands without hesitation',
    instruction: `You are an Ultra-Minimal CLI Trace Steerer. Output ONLY the single next sentence command for the user to paste into the terminal. Zero explanations, zero formatting, zero Turn headers. Terse, direct, and pragmatic.`,
  },
];

export function getGlobalSystemInstruction(): string {
  if (typeof window === 'undefined') return DEFAULT_TRACE_SYSTEM_INSTRUCTION;
  const stored = localStorage.getItem(GLOBAL_SYSTEM_PROMPT_STORAGE_KEY);
  if (stored && stored.trim()) return stored.trim();
  return DEFAULT_TRACE_SYSTEM_INSTRUCTION;
}

export function setGlobalSystemInstruction(instruction: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GLOBAL_SYSTEM_PROMPT_STORAGE_KEY, instruction.trim());
  }
}

export function getInitialWarmupPrompt(initialPrompt: string): string {
  return `TASK CONTEXT (Already sent to the CLI agent as Turn 1):
"""
${initialPrompt}
"""

The CLI agent has just received this initial task prompt and is exploring the codebase. Generate the immediate next follow-up prompt (Turn 2) to steer or check in on its first findings. Remember: output ONLY the raw prompt text with zero labels or extra commentary.`;
}

export function cleanPromptOutput(rawText: string): string {
  let cleaned = rawText.trim();
  // Strip code block fences if accidentally wrapped
  if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }
  // Strip accidental enclosing quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // Strip accidental "Turn X:", "Next Prompt:", etc. prefixes
  cleaned = cleaned
    .replace(
      /^(Turn\s*\d+[:\-.]?|Next\s*Prompt[:\-.]?|Follow-up\s*Prompt[:\-.]?|Prompt[:\-.]?)\s*/i,
      ''
    )
    .trim();
  return cleaned;
}

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
  systemInstruction?: string;
}

export function buildTurnContext({
  initialPrompt,
  messages,
  newUserMessage,
}: BuildTurnContextOptions) {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  // When no conversation history exists yet, use the initial warm-up message as Turn 1
  if (messages.length === 0) {
    contents.push({
      role: 'user',
      parts: [
        {
          text: getInitialWarmupPrompt(initialPrompt),
        },
      ],
    });
  } else {
    // For ongoing turns (Turn 3+):
    // 1. Initial warm-up context setup as the anchor user message so Gemini always retains the task scope
    contents.push({
      role: 'user',
      parts: [
        {
          text: `TASK CONTEXT (Already sent to the CLI agent as Turn 1):\n"""\n${initialPrompt}\n"""`,
        },
      ],
    });

    // 2. Sliding window of recent turns (up to 12 turns)
    const recentHistory = messages.slice(-12);
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
  systemInstruction,
}: BuildTurnContextOptions): Promise<string> {
  const apiKey = getStoredGeminiKey();
  const selectedModel = getSelectedModel();

  if (!apiKey) {
    // Graceful demo simulation fallback when API key is not yet set
    return `[Demo Mode - Set Gemini API Key in Settings for live calls]\nCheck the terminal logs for any warning or error outputs, and verify that the tests are passing with \`npm test\`.`;
  }

  const activeSystemInstruction =
    systemInstruction && systemInstruction.trim()
      ? systemInstruction.trim()
      : getGlobalSystemInstruction();

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
          systemInstruction: activeSystemInstruction,
        },
      });

      const text = response.text || '';
      if (text && text.trim()) {
        return cleanPromptOutput(text);
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
