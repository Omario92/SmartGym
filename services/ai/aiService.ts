/**
 * AI Smart Trainer — Gemini API service
 * Direct REST calls to Google Gemini with retry logic, error mapping, and JSON parsing.
 * Model: gemini-2.0-flash (fast, cheap, JSON mode supported)
 */

import type {
  AIBuildContext,
  AIGeneratedRoutine,
  AIExerciseFill,
  AISmartWeeklyPlan,
  AIServiceError,
} from './types';
import {
  buildRoutinePrompt,
  buildExerciseFillPrompt,
  buildWeeklyPlanPrompt,
} from './prompts';

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_PROVIDER = process.env.EXPO_PUBLIC_AI_PROVIDER || 'gemini';
const AI_MODEL = process.env.EXPO_PUBLIC_AI_MODEL || 'gemini-2.0-flash';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

// ─── Low-level caller ─────────────────────────────────────────────────────────

interface GeminiRequest {
  systemInstruction?: { parts: Array<{ text: string }> };
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  generationConfig?: Record<string, unknown>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { code?: number; message?: string; status?: string };
}

async function callAI<T>(
  apiKey: string,
  prompt: string,
  retries = 2
): Promise<T> {
  const isOpenRouter = AI_PROVIDER === 'openrouter';
  
  const url = isOpenRouter ? OPENROUTER_BASE : `${GEMINI_BASE}/${AI_MODEL}:generateContent?key=${apiKey}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isOpenRouter) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = 'https://smartgym.app'; // Required by OpenRouter
    headers['X-Title'] = 'SmartGym AI';
  }

  const body = isOpenRouter 
    ? {
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }
    : {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      };

  let lastError: AIServiceError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle OpenRouter error format
        const errorMsg = isOpenRouter 
          ? data.error?.message || data.error?.metadata?.raw || 'OpenRouter error'
          : data.error?.message ?? '';
          
        const err = mapHttpError(response.status, errorMsg);
        if (!err.retryable || attempt === retries) throw err;
        lastError = err;
        await delay(800 * (attempt + 1));
        continue;
      }

      let text = '';
      if (isOpenRouter) {
        text = data.choices?.[0]?.message?.content || '';
      } else {
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      if (!text) {
        const err: AIServiceError = {
          code: 'parse_error',
          message: 'AI returned an empty response. Please try again.',
          retryable: true,
        };
        if (attempt === retries) throw err;
        lastError = err;
        await delay(500);
        continue;
      }

      // Strip potential markdown fences
      const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      try {
        return JSON.parse(clean) as T;
      } catch {
        const err: AIServiceError = {
          code: 'parse_error',
          message: 'AI response could not be parsed. Please try again.',
          retryable: true,
        };
        if (attempt === retries) throw err;
        lastError = err;
        await delay(500);
        continue;
      }
    } catch (thrown) {
      if ((thrown as AIServiceError).code) throw thrown;

      const message = (thrown as Error)?.message ?? '';
      const isNetwork =
        message.includes('Network request failed') ||
        message.includes('fetch') ||
        message.includes('connect');

      const err: AIServiceError = {
        code: isNetwork ? 'network' : 'unknown',
        message: isNetwork
          ? 'No internet connection. Check your network and try again.'
          : `Unexpected error: ${message}`,
        retryable: isNetwork,
      };
      if (!err.retryable || attempt === retries) throw err;
      lastError = err;
      await delay(500);
    }
  }

  throw lastError ?? ({ code: 'unknown', message: 'Unknown error', retryable: false } as AIServiceError);
}

// ─── HTTP error mapper ────────────────────────────────────────────────────────

function mapHttpError(status: number, message: string): AIServiceError {
  const msg = message.toLowerCase();

  if (status === 400) {
    if (msg.includes('api key') || msg.includes('invalid') || msg.includes('auth')) {
      return { code: 'invalid_key', message: 'Invalid API key. Check your key in the .env file.', retryable: false };
    }
    return { code: 'parse_error', message: `Bad request: ${message}`, retryable: false };
  }
  if (status === 401 || status === 403) {
    return { code: 'invalid_key', message: 'API key is unauthorized. Verify your key in the .env file.', retryable: false };
  }
  if (status === 429) {
    return { code: 'rate_limit', message: 'Rate limit reached. Wait a moment and try again.', retryable: true };
  }
  if (status === 503 || status === 500) {
    return { code: 'model_overloaded', message: 'AI service is temporarily overloaded. Retrying...', retryable: true };
  }
  if (status === 404) {
    return { code: 'unknown', message: `Model not found on OpenRouter. Check EXPO_PUBLIC_AI_MODEL in .env.`, retryable: false };
  }

  return { code: 'unknown', message: `API error (${status}): ${message}`, retryable: false };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Feature 1: Generate Routine ─────────────────────────────────────────────

export async function generateRoutine(
  apiKey: string,
  ctx: AIBuildContext
): Promise<AIGeneratedRoutine> {
  const prompt = buildRoutinePrompt(ctx);
  const result = await callAI<AIGeneratedRoutine>(apiKey, prompt);

  // Sanitize: ensure numeric fields are numbers
  result.estimatedDuration = Number(result.estimatedDuration) || 45;
  result.exercises = (result.exercises ?? []).map((e) => ({
    ...e,
    sets: Math.max(1, Math.min(10, Number(e.sets) || 3)),
    reps: Math.max(1, Math.min(50, Number(e.reps) || 10)),
    weight: e.weight != null ? Number(e.weight) || undefined : undefined,
    restSeconds: e.restSeconds != null ? Number(e.restSeconds) || 60 : undefined,
  }));

  return result;
}

// ─── Feature 2: Auto-Fill Exercise ───────────────────────────────────────────

export async function fillExerciseDetails(
  exerciseName: string,
  muscleGroup: string,
  apiKey: string
): Promise<AIExerciseFill> {
  const prompt = buildExerciseFillPrompt(exerciseName, muscleGroup);
  return callAI<AIExerciseFill>(apiKey, prompt);
}

// ─── Feature 3: Smart Weekly Plan ────────────────────────────────────────────

export async function generateSmartWeeklyPlan(
  apiKey: string,
  ctx: AIBuildContext
): Promise<AISmartWeeklyPlan> {
  const prompt = buildWeeklyPlanPrompt(ctx);
  const result = await callAI<AISmartWeeklyPlan>(apiKey, prompt);

  const DAYS: string[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];

  // Ensure all 7 days are present
  const planMap = new Map((result.weekPlan ?? []).map((d) => [d.day, d]));
  result.weekPlan = DAYS.map(
    (day) =>
      planMap.get(day as (typeof result.weekPlan)[0]['day']) ?? {
        day: day as (typeof result.weekPlan)[0]['day'],
        type: 'rest' as const,
        reasoning: 'Rest day for recovery.',
      }
  );

  result.weeklyVolumeSets = Number(result.weeklyVolumeSets) || 0;

  return result;
}

// ─── API Key validator ────────────────────────────────────────────────────────

export async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1`;
    const res = await fetch(url, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
