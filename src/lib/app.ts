import { supabase } from "@/integrations/supabase/client";

export const JUDGE_FACTORS = [
  "tone",
  "tool_call",
  "task_completion",
  "hallucination",
  "persona_fidelity",
  "correct_handling",
  "dialogue_strength",
  "convincing_ability",
] as const;
export type JudgeFactor = (typeof JUDGE_FACTORS)[number];

export const MODEL_OPTIONS = {
  openai: ["gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"],
  anthropic: ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-7"],
  google: ["gemini-2.5-flash", "gemini-2.5-pro"],
};

export const ALL_MODELS = [
  ...MODEL_OPTIONS.openai,
  ...MODEL_OPTIONS.anthropic,
  ...MODEL_OPTIONS.google,
];

export async function getCurrentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export function fmtDuration(ms?: number | null) {
  if (!ms || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rs = Math.round(s % 60);
  return `${m}m ${rs}s`;
}
