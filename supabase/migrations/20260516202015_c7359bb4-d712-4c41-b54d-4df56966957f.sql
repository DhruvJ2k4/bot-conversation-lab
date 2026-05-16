
-- ===== Tables (frozen schema per spec) =====

CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  openai_api_key text,
  anthropic_api_key text,
  google_api_key text,
  openrouter_api_key text,
  default_bot_model text DEFAULT 'gpt-4.1',
  default_lead_model text DEFAULT 'claude-sonnet-4-5',
  default_judge_model text DEFAULT 'gemini-2.5-flash',
  caching_enabled boolean DEFAULT false,
  token_tracker_enabled boolean DEFAULT false,
  cost_tracker_enabled boolean DEFAULT false,
  cc_api_base_url text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('monolithic','pc_project')),
  system_prompt text NOT NULL,
  end_system_prompt text NOT NULL DEFAULT '',
  sections jsonb DEFAULT '[]',
  version int DEFAULT 1,
  description text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.lead_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  prompt text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  attributes jsonb DEFAULT '{}',
  overlay_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  scenario text NOT NULL,
  expected_behavior text,
  overlay_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.seed_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  turns jsonb NOT NULL,
  source text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.judge_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  prompt text NOT NULL,
  factors text[] NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text,
  bot_prompt_id uuid NOT NULL REFERENCES public.prompts(id),
  lead_prompt_id uuid NOT NULL REFERENCES public.lead_prompts(id),
  judge_prompt_id uuid REFERENCES public.judge_prompts(id),
  config jsonb NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','done','failed','cancelled')),
  status_message text,
  metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE public.run_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  order_index int NOT NULL,
  pc_section_id text,
  persona_id uuid REFERENCES public.personas(id),
  test_case_id uuid REFERENCES public.test_cases(id),
  seed_conversation_id uuid REFERENCES public.seed_conversations(id),
  repeat_count int NOT NULL DEFAULT 1,
  factors_enabled text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  run_config_id uuid NOT NULL REFERENCES public.run_configs(id),
  config_label text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','done','failed','cancelled')),
  status_message text,
  bot_system_prompt_resolved text NOT NULL,
  lead_prompt_resolved text NOT NULL,
  turn_count int DEFAULT 0,
  total_latency_ms bigint DEFAULT 0,
  avg_score numeric(4,2),
  scores_by_factor jsonb DEFAULT '{}',
  total_tokens_in bigint DEFAULT 0,
  total_tokens_out bigint DEFAULT 0,
  total_cost_usd numeric(10,6) DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.turns (
  id bigserial PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  turn_index int NOT NULL,
  speaker text NOT NULL CHECK (speaker IN ('bot','lead','system')),
  content text NOT NULL,
  raw_output jsonb,
  metadata jsonb DEFAULT '{}',
  latency_ms int,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10,6),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_turns_conv ON public.turns(conversation_id, turn_index);

CREATE TABLE public.scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  judge_prompt_id uuid NOT NULL REFERENCES public.judge_prompts(id),
  factor text NOT NULL,
  score numeric(3,1) NOT NULL,
  rationale text,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX idx_scores_conv_factor ON public.scores(conversation_id, factor);

CREATE TABLE public.llm_calls (
  id bigserial PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  turn_id bigint REFERENCES public.turns(id),
  role text CHECK (role IN ('bot','lead','judge')),
  provider text NOT NULL,
  model text NOT NULL,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10,6),
  latency_ms int,
  cache_hit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ===== RLS =====
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_calls ENABLE ROW LEVEL SECURITY;

-- Owner policies: user_id = auth.uid()
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'settings','prompts','lead_prompts','personas','test_cases',
    'seed_conversations','judge_prompts','runs'
  ] LOOP
    EXECUTE format('CREATE POLICY "owner_all" ON public.%I FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t);
  END LOOP;
END $$;

-- Child tables: check via parent run
CREATE POLICY "via_run_all" ON public.run_configs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.runs r WHERE r.id = run_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

CREATE POLICY "via_run_all" ON public.conversations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.runs r WHERE r.id = run_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

CREATE POLICY "via_conv_all" ON public.turns FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.runs r ON r.id = c.run_id
    WHERE c.id = conversation_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.runs r ON r.id = c.run_id
    WHERE c.id = conversation_id AND r.user_id = auth.uid()));

CREATE POLICY "via_conv_all" ON public.scores FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.runs r ON r.id = c.run_id
    WHERE c.id = conversation_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.runs r ON r.id = c.run_id
    WHERE c.id = conversation_id AND r.user_id = auth.uid()));

CREATE POLICY "via_conv_all" ON public.llm_calls FOR ALL
  USING (conversation_id IS NULL OR EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.runs r ON r.id = c.run_id
    WHERE c.id = conversation_id AND r.user_id = auth.uid()))
  WITH CHECK (conversation_id IS NULL OR EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.runs r ON r.id = c.run_id
    WHERE c.id = conversation_id AND r.user_id = auth.uid()));

-- ===== Realtime =====
ALTER TABLE public.runs REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.turns REPLICA IDENTITY FULL;
ALTER TABLE public.scores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.turns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;

-- ===== Seed defaults on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user_seed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.judge_prompts (user_id, name, prompt, factors, is_default) VALUES (
    NEW.id,
    'Default V0 Judge',
    E'You are an expert evaluator of voice-bot conversations.\nScore the following conversation on a 1.0 - 5.0 scale on each\nof the requested factors. For each factor, provide a brief\nrationale (one or two sentences) grounded in specific turns.\n\nOutput ONLY a JSON object of the shape:\n{\n  "factor_name": {"score": float, "rationale": "string"},\n  ...\n}\n\nBe strict. A 5.0 is reserved for genuinely excellent behavior.\nA 1.0 means the bot failed on this dimension.\n\nFactors to score: {{factors_list}}\n\nConversation:\n{{conversation_transcript}}',
    ARRAY['tone','tool_call','task_completion','hallucination','persona_fidelity','correct_handling','dialogue_strength','convincing_ability'],
    true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_seed
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_seed();
